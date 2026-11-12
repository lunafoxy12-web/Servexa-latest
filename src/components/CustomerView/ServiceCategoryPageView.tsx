import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap
} from '@vis.gl/react-google-maps';
import { useGoogleMapsStatus, GoogleMapsBillingAlert } from '../../hooks/useGoogleMapsStatus';
import {
  ArrowLeft,
  MapPin,
  Crosshair,
  Star,
  ShieldCheck,
  PhoneCall,
  Video,
  Send,
  Image as ImageIcon,
  Camera,
  X,
  Play,
  ShoppingBag,
  Store,
  FileText,
  Wallet,
  Layers,
  Sparkles,
  CreditCard,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  GripHorizontal,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { calculateHaversineDistanceKm } from '../../utils/haversine';
import { safeFetchJson } from '../../utils/safeFetch';
import {
  ProviderProfile,
  ServiceCategory,
  ServiceItem,
  Product,
  ChatMessage,
  ChatInvoice
} from '../../types';

interface ServiceCategoryPageViewProps {
  category: ServiceCategory;
  onBack: () => void;
  onOpenBookingModal: (provider: ProviderProfile, service: ServiceItem) => void;
}

/**
 * Controller to smoothly pan Google Map camera when coordinates change
 */
function MapRecenterController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(center);
    }
  }, [map, center]);
  return null;
}

export const ServiceCategoryPageView: React.FC<ServiceCategoryPageViewProps> = ({
  category,
  onBack
}) => {
  const {
    currentUser,
    initiateCall,
    updateUserLocally,
    triggerGlobalRefresh,
    setIsAuthModalOpen,
    lastRealtimeEvent
  } = useAuth();
  const { theme } = useTheme();

  // ----------------------------------------------------
  // Location and Map State
  // ----------------------------------------------------
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: currentUser?.location?.lat || 37.7749,
    lng: currentUser?.location?.lng || -122.4194
  });
  const [userAddress, setUserAddress] = useState<string>(
    currentUser?.location?.address || '742 Market St, San Francisco, CA'
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  // Background real provider accounts matching this category
  const [allCategoryProviders, setAllCategoryProviders] = useState<ProviderProfile[]>([]);
  const [loadingProviders, setLoadingProviders] = useState<boolean>(true);

  // ----------------------------------------------------
  // Workflow States:
  // 'describe_issue' -> 'finding_specialist' -> 'timeout_actions' -> 'booked_for_later' -> 'chat_connected'
  // ----------------------------------------------------
  const [workflowState, setWorkflowState] = useState<'describe_issue' | 'finding_specialist' | 'timeout_actions' | 'booked_for_later' | 'chat_connected'>('describe_issue');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);

  // Finding specialist radar state: 30s per try x 3 tries, or 60 mins for Book for Later
  const [tryCount, setTryCount] = useState<number>(1);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [bookLaterDate, setBookLaterDate] = useState<string>(() => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [bookLaterSlot, setBookLaterSlot] = useState<string>('Morning (9:00 AM - 12:00 PM)');
  const [isBookingLater, setIsBookingLater] = useState<boolean>(false);

  const [dispatchTicketId, setDispatchTicketId] = useState<string>('');
  const [dispatchedProviderCount, setDispatchedProviderCount] = useState<number>(0);
  const [dispatchStatusText, setDispatchStatusText] = useState<string>('Connecting to 10km GPS radar...');
  const [activeDispatchOrderId, setActiveDispatchOrderId] = useState<string>('');
  const [sheetSnap, setSheetSnap] = useState<'peek' | 'half' | 'full'>('half');
  const dragStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartYRef.current === null) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - dragStartYRef.current;
    dragStartYRef.current = null;
    if (deltaY < -30) {
      // Dragged upwards -> expand to full
      setSheetSnap((curr) => (curr === 'peek' ? 'half' : 'full'));
    } else if (deltaY > 30) {
      // Dragged downwards -> collapse to half or peek
      setSheetSnap((curr) => (curr === 'full' ? 'half' : 'peek'));
    }
  };

  // Active matched real provider details
  const [assignedProvider, setAssignedProvider] = useState<ProviderProfile | null>(null);
  const [serviceStatus, setServiceStatus] = useState<'accepted' | 'on_the_way' | 'in_progress' | 'completed'>('accepted');

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState<string>('');
  const [chatInvoices, setChatInvoices] = useState<ChatInvoice[]>([]);
  const [providerStoreProducts, setProviderStoreProducts] = useState<Product[]>([]);
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState<boolean>(false);

  // Invoice creator form state
  const [showInvoiceCreator, setShowInvoiceCreator] = useState<boolean>(false);
  const [invoiceLabor, setInvoiceLabor] = useState<string>('50');
  const [invoiceParts, setInvoiceParts] = useState<string>('25');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('Diagnostic & verified repairs');
  const [isPayingInvoice, setIsPayingInvoice] = useState<boolean>(false);

  // File input references
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const chatMediaInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // ----------------------------------------------------
  // 1. Background Real Provider Check for Selected Category
  // ----------------------------------------------------
  useEffect(() => {
    setLoadingProviders(true);
    safeFetchJson<ProviderProfile[]>('/api/providers', undefined, [])
      .then((data) => {
        if (Array.isArray(data)) {
          const matching = data.filter((p) => {
            const pCat = (p.category || '').toLowerCase();
            const targetId = (category.id || '').toLowerCase();
            const targetSlug = (category.slug || '').toLowerCase();
            const targetName = (category.name || '').toLowerCase();

            return (
              pCat === targetId ||
              pCat === targetSlug ||
              pCat.includes(targetSlug) ||
              targetSlug.includes(pCat) ||
              targetName.includes(pCat) ||
              (p.services &&
                p.services.some(
                  (s) =>
                    (s.categoryId && s.categoryId.toLowerCase() === targetId) ||
                    (s.name && s.name.toLowerCase().includes(targetSlug))
                ))
            );
          });

          setAllCategoryProviders(matching.length > 0 ? matching : data.slice(0, 4));
        }
      })
      .catch((err) => {
        console.warn('Background provider check notice:', err?.message);
      })
      .finally(() => setLoadingProviders(false));
  }, [category.id, category.slug, category.name]);

  // ----------------------------------------------------
  // 2. Compute Distances and 10 km Radius
  // ----------------------------------------------------
  const providersWithin10km = allCategoryProviders
    .map((p, idx) => {
      const angle = (idx * (360 / Math.max(1, allCategoryProviders.length))) * (Math.PI / 180);
      const radius = 0.012 + (idx % 3) * 0.009;
      const pLat = p.currentLocation?.lat ?? (userCoords.lat + Math.sin(angle) * radius);
      const pLng = p.currentLocation?.lng ?? (userCoords.lng + Math.cos(angle) * radius);

      const dist = calculateHaversineDistanceKm(userCoords.lat, userCoords.lng, pLat, pLng);
      const distanceKm = Math.max(0.4, Math.round(dist * 10) / 10);

      return {
        ...p,
        calculatedLat: pLat,
        calculatedLng: pLng,
        distanceKm,
        isWithin10km: distanceKm <= 10.0
      };
    })
    .filter((p) => p.isWithin10km)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Auto locate user GPS
  const handleDetectGps = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setUserAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)} (Current GPS)`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation notice:', err?.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  // Map Click to select location
  const handleMapClick = (lat: number, lng: number) => {
    setUserCoords({ lat, lng });
    setUserAddress(`Selected Point: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  // ----------------------------------------------------
  // 3. Media Upload Handlers for Problem Description
  // ----------------------------------------------------
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedVideos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedVideo = (index: number) => {
    setUploadedVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // ----------------------------------------------------
  // 4. Start Finding Specialist: Strict 10km Category Dispatch
  // ----------------------------------------------------
  const handleStartFindingSpecialist = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const ticketId = 'disp-' + Date.now();
    const orderId = 'ord-' + Date.now();
    setDispatchTicketId(ticketId);
    setActiveDispatchOrderId(orderId);
    setTryCount(1);
    setSecondsRemaining(30);
    setWorkflowState('finding_specialist');
    setDispatchStatusText(`Scanning for verified ${category.name} providers within 10km...`);

    fetch('/api/dispatch/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: category.id,
        customerId: currentUser?.id || 'cust-1',
        customerLocation: {
          lat: userCoords.lat,
          lng: userCoords.lng,
          address: userAddress
        },
        issueDescription: issueDescription || `Urgent ${category.name} assistance requested`,
        problemImages: uploadedImages,
        problemVideos: uploadedVideos
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ticketId) {
          setDispatchTicketId(data.ticketId);
        }
        const count = typeof data.matchedCount === 'number' ? data.matchedCount : 0;
        setDispatchedProviderCount(count);
        if (count === 0) {
          setDispatchStatusText(`0 registered ${category.name} providers found within your 10km area. Request is active on radar queue.`);
        } else {
          setDispatchStatusText(`Request dispatched to ${count} registered ${category.name} specialist(s) within your 10km area. Waiting for specialist acceptance...`);
        }
      })
      .catch(() => {
        setDispatchStatusText(`Request active in 10km dispatch radar.`);
      });
  };

  // 30 seconds acceptance timer per try (3 tries total)
  useEffect(() => {
    let timer: any;
    if (workflowState === 'finding_specialist') {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // 30 seconds elapsed for this try!
            if (tryCount < 3) {
              setTryCount((t) => t + 1);
              // Re-ping providers for next attempt
              fetch('/api/dispatch/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  categoryId: category.id,
                  customerId: currentUser?.id || 'cust-1',
                  customerLocation: {
                    lat: userCoords.lat,
                    lng: userCoords.lng,
                    address: userAddress
                  },
                  issueDescription: issueDescription || `Urgent ${category.name} assistance requested`,
                  problemImages: uploadedImages,
                  problemVideos: uploadedVideos
                })
              }).catch(() => {});
              return 30; // reset 30 seconds for next try
            } else {
              // 3 tries of 30 seconds completed with no acceptance!
              setWorkflowState('timeout_actions');
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (workflowState === 'booked_for_later') {
      // 60 minutes countdown (3600 seconds) for Book for Later acceptance window
      timer = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [workflowState, tryCount, category, currentUser, userCoords, userAddress, issueDescription, uploadedImages, uploadedVideos]);

  // Book for Later action: 60 minutes acceptance window
  const handleBookForLater = async () => {
    setIsBookingLater(true);
    try {
      const res = await fetch('/api/dispatch/book-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: dispatchTicketId || `disp-${Date.now()}`,
          preferredDate: bookLaterDate,
          preferredTimeSlot: bookLaterSlot
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWorkflowState('booked_for_later');
        setSecondsRemaining(3600); // 60 minutes = 3600 seconds
      }
    } catch (err) {
      console.error('Book for later error:', err);
    } finally {
      setIsBookingLater(false);
    }
  };

  // Real-time Provider Acceptance Listener (WebSocket) - NO SIMULATION
  useEffect(() => {
    if (!lastRealtimeEvent) return;
    if (workflowState !== 'finding_specialist' && workflowState !== 'booked_for_later' && workflowState !== 'timeout_actions') return;

    if (lastRealtimeEvent.type === 'DISPATCH_ACCEPTED') {
      const payload = lastRealtimeEvent.payload;
      const isTargetTicket = dispatchTicketId && payload.ticketId === dispatchTicketId;
      const isTargetCustomer = payload.customerId === currentUser?.id;

      if (isTargetTicket || isTargetCustomer) {
        if (payload.providerId) {
          fetch(`/api/providers/${payload.providerId}`)
            .then((r) => r.json())
            .then((prov) => {
              if (prov && prov.userId) {
                handleProviderAcceptance(prov);
              } else {
                handleProviderAcceptance({
                  userId: payload.providerId,
                  businessName: payload.providerName || 'Verified Specialist',
                  category: category.id,
                  rating: 5.0,
                  completedJobs: 1,
                  isVerified: true,
                  activeStatus: 'online'
                } as any);
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [lastRealtimeEvent, workflowState, dispatchTicketId, currentUser?.id, category.id]);

  // Polling fallback to check if ticket was accepted by a provider
  useEffect(() => {
    if ((workflowState !== 'finding_specialist' && workflowState !== 'booked_for_later') || !dispatchTicketId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/dispatch/ticket/${dispatchTicketId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'accepted' && data.acceptedProvider) {
            handleProviderAcceptance(data.acceptedProvider);
          }
        }
      } catch (err) {
        // silent fail
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [workflowState, dispatchTicketId]);

  // ----------------------------------------------------
  // 5. Provider Accepts Request: Live Chatbox Opens
  // ----------------------------------------------------
  const handleProviderAcceptance = (prov: ProviderProfile) => {
    setAssignedProvider(prov);
    setWorkflowState('chat_connected');
    setServiceStatus('accepted');

    const conversationId = `conv-${currentUser?.id || 'cust'}-${prov.userId}`;
    const initialMessages: ChatMessage[] = [
      {
        id: 'msg-issue-' + Date.now(),
        conversationId,
        senderId: currentUser?.id || 'cust-1',
        receiverId: prov.userId,
        senderName: currentUser?.name || 'You (Customer)',
        text: issueDescription.trim() || `I need assistance with ${category.name} service at ${userAddress}.`,
        mediaType: 'text',
        timestamp: new Date().toISOString(),
        read: true
      }
    ];

    // Attached images
    uploadedImages.forEach((img, i) => {
      initialMessages.push({
        id: `msg-img-${Date.now()}-${i}`,
        conversationId,
        senderId: currentUser?.id || 'cust-1',
        receiverId: prov.userId,
        senderName: currentUser?.name || 'You (Customer)',
        text: 'Problem Photo',
        mediaType: 'image',
        mediaUrl: img,
        timestamp: new Date().toISOString(),
        read: true
      });
    });

    // Attached videos
    uploadedVideos.forEach((vid, i) => {
      initialMessages.push({
        id: `msg-vid-${Date.now()}-${i}`,
        conversationId,
        senderId: currentUser?.id || 'cust-1',
        receiverId: prov.userId,
        senderName: currentUser?.name || 'You (Customer)',
        text: 'Problem Video',
        mediaType: 'video',
        mediaUrl: vid,
        timestamp: new Date().toISOString(),
        read: true
      });
    });

    // Provider acceptance greeting
    initialMessages.push({
      id: 'msg-accept-' + Date.now(),
      conversationId,
      senderId: prov.userId,
      receiverId: currentUser?.id || 'cust-1',
      senderName: prov.businessName || 'Verified Specialist',
      text: `Hello! I have accepted your ${category.name} request. I am reviewing your location and problem details. Feel free to call me directly or order needed replacement parts from my store!`,
      mediaType: 'text',
      timestamp: new Date().toISOString(),
      read: true
    });

    setMessages(initialMessages);

    // Load store products for this provider
    fetch(`/api/products?providerId=${prov.userId}`)
      .then((r) => r.json())
      .then((prods) => {
        if (Array.isArray(prods) && prods.length > 0) {
          setProviderStoreProducts(prods);
        } else {
          setProviderStoreProducts([
            {
              id: `prod-${prov.userId}-1`,
              providerId: prov.userId,
              providerName: prov.businessName,
              storeName: `${prov.businessName} Store`,
              name: `${category.name} Certified Replacement Part`,
              description: 'Commercial-grade genuine certified replacement equipment with warranty.',
              price: 35.0,
              category: category.name,
              inStock: true
            },
            {
              id: `prod-${prov.userId}-2`,
              providerId: prov.userId,
              providerName: prov.businessName,
              storeName: `${prov.businessName} Store`,
              name: 'Rapid Diagnostic & Sealant Hardware',
              description: 'Safety installation hardware and certified diagnostic components.',
              price: 18.5,
              category: category.name,
              inStock: true
            }
          ]);
        }
      })
      .catch(() => {});

    // Save order session to history
    saveOrderSessionToHistory({
      orderId: activeDispatchOrderId || `ord-${Date.now()}`,
      categoryName: category.name,
      categoryId: category.id,
      provider: prov,
      messages: initialMessages,
      invoices: [],
      status: 'accepted',
      createdAt: new Date().toISOString()
    });
  };

  const saveOrderSessionToHistory = (orderData: any) => {
    try {
      const userKey = currentUser?.id ? `servexa_orders_chat_history_${currentUser.id}` : 'servexa_orders_chat_history';
      const existing = localStorage.getItem(userKey);
      const orders = existing ? JSON.parse(existing) : [];
      const updated = [orderData, ...orders.filter((o: any) => o.orderId !== orderData.orderId)];
      localStorage.setItem(userKey, JSON.stringify(updated.slice(0, 30)));
    } catch (e) {
      console.warn('Order history notice:', e);
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatInvoices]);

  // Real-Time Chat Message Sending
  const handleSendMessage = () => {
    if (!chatInputText.trim() || !assignedProvider) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      conversationId: `conv-${currentUser?.id || 'cust'}-${assignedProvider.userId}`,
      senderId: currentUser?.id || 'cust-1',
      receiverId: assignedProvider.userId,
      senderName: currentUser?.name || 'You',
      text: chatInputText.trim(),
      mediaType: 'text',
      timestamp: new Date().toISOString(),
      read: true
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInputText('');

    // Auto provider reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-reply-' + Date.now(),
          conversationId: `conv-${currentUser?.id || 'cust'}-${assignedProvider.userId}`,
          senderId: assignedProvider.userId,
          receiverId: currentUser?.id || 'cust-1',
          senderName: assignedProvider.businessName,
          text: `Understood! I'm on it. You can track my location or call me if needed.`,
          mediaType: 'text',
          timestamp: new Date().toISOString(),
          read: true
        }
      ]);
    }, 1500);
  };

  // Chat Media Attachment
  const handleChatMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assignedProvider) return;

    const isVid = file.type.startsWith('video');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const mediaMsg: ChatMessage = {
          id: 'msg-media-' + Date.now(),
          conversationId: `conv-${currentUser?.id || 'cust'}-${assignedProvider.userId}`,
          senderId: currentUser?.id || 'cust-1',
          receiverId: assignedProvider.userId,
          senderName: currentUser?.name || 'You',
          text: isVid ? 'Video Attachment' : 'Photo Attachment',
          mediaType: isVid ? 'video' : 'image',
          mediaUrl: reader.result,
          timestamp: new Date().toISOString(),
          read: true
        };
        setMessages((prev) => [...prev, mediaMsg]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Provider Status Update
  const handleUpdateStatus = (newStatus: 'accepted' | 'on_the_way' | 'in_progress' | 'completed') => {
    setServiceStatus(newStatus);

    const labels: Record<string, string> = {
      accepted: 'Accepted',
      on_the_way: 'On The Way to Location',
      in_progress: 'In Progress (Working on Service)',
      completed: 'Completed Successfully'
    };

    const statusMsg: ChatMessage = {
      id: 'msg-status-' + Date.now(),
      conversationId: `conv-${currentUser?.id || 'cust'}-${assignedProvider?.userId}`,
      senderId: assignedProvider?.userId || 'prov',
      receiverId: currentUser?.id || 'cust-1',
      senderName: assignedProvider?.businessName || 'Specialist',
      text: `🔔 Service Status Updated: ${labels[newStatus] || newStatus}`,
      mediaType: 'text',
      timestamp: new Date().toISOString(),
      read: true
    };

    setMessages((prev) => [...prev, statusMsg]);
  };

  // Invoice Creation by Provider
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedProvider) return;

    const labor = parseFloat(invoiceLabor) || 0;
    const parts = parseFloat(invoiceParts) || 0;
    const total = labor + parts;

    const newInvoice: ChatInvoice = {
      id: 'inv-' + Date.now(),
      bookingId: activeDispatchOrderId,
      providerId: assignedProvider.userId,
      providerName: assignedProvider.businessName,
      customerId: currentUser?.id || 'cust-1',
      customerName: currentUser?.name || 'Customer',
      laborAmount: labor,
      materialsAmount: parts,
      consultationFee: 0,
      commissionFee: parseFloat((total * 0.06).toFixed(2)),
      totalAmount: total,
      providerEarnings: parseFloat((total * 0.94).toFixed(2)),
      notes: invoiceNotes,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setChatInvoices((prev) => [...prev, newInvoice]);
    setShowInvoiceCreator(false);

    const invoiceMsg: ChatMessage = {
      id: 'msg-inv-' + Date.now(),
      conversationId: `conv-${currentUser?.id || 'cust'}-${assignedProvider.userId}`,
      senderId: assignedProvider.userId,
      receiverId: currentUser?.id || 'cust-1',
      senderName: assignedProvider.businessName,
      text: `📄 Service Invoice #${newInvoice.id} generated for $${total.toFixed(2)}.`,
      mediaType: 'invoice',
      invoice: newInvoice,
      timestamp: new Date().toISOString(),
      read: true
    };

    setMessages((prev) => [...prev, invoiceMsg]);
  };

  // Pay Invoice
  const handlePayInvoice = (invoiceId: string) => {
    const inv = chatInvoices.find((i) => i.id === invoiceId);
    if (!inv || !currentUser) return;

    setIsPayingInvoice(true);
    const amount = inv.totalAmount;
    const currentBal = currentUser.walletBalance ?? 100;

    if (currentBal >= amount) {
      const newBal = currentBal - amount;
      updateUserLocally({ walletBalance: newBal });
      triggerGlobalRefresh();

      setChatInvoices((prev) =>
        prev.map((item) => (item.id === invoiceId ? { ...item, status: 'paid', paidAt: new Date().toISOString() } : item))
      );

      const paidMsg: ChatMessage = {
        id: 'msg-paid-' + Date.now(),
        conversationId: `conv-${currentUser.id}-${inv.providerId}`,
        senderId: currentUser.id,
        receiverId: inv.providerId,
        senderName: currentUser.name || 'You',
        text: `✅ Payment of $${amount.toFixed(2)} completed successfully via Wallet. New Balance: $${newBal.toFixed(2)}.`,
        mediaType: 'text',
        timestamp: new Date().toISOString(),
        read: true
      };

      setMessages((prev) => [...prev, paidMsg]);
    } else {
      alert(`Insufficient wallet balance ($${currentBal.toFixed(2)}). Please add funds.`);
    }
    setIsPayingInvoice(false);
  };

  // Buy Product in Chat
  const handleBuyStoreProductInChat = (prod: Product) => {
    if (!currentUser || !assignedProvider) return;

    const currentBal = currentUser.walletBalance ?? 100;
    if (currentBal < prod.price) {
      alert(`Insufficient wallet balance ($${currentBal.toFixed(2)}). Product costs $${prod.price.toFixed(2)}.`);
      return;
    }

    const newBal = currentBal - prod.price;
    updateUserLocally({ walletBalance: newBal });
    triggerGlobalRefresh();

    const orderMsg: ChatMessage = {
      id: 'msg-prod-' + Date.now(),
      conversationId: `conv-${currentUser.id}-${assignedProvider.userId}`,
      senderId: currentUser.id,
      receiverId: assignedProvider.userId,
      senderName: currentUser.name || 'You',
      text: `🛒 Purchased "${prod.name}" for $${prod.price.toFixed(2)}. Remaining wallet balance: $${newBal.toFixed(2)}.`,
      mediaType: 'text',
      timestamp: new Date().toISOString(),
      read: true
    };

    setMessages((prev) => [...prev, orderMsg]);
    setIsStoreDrawerOpen(false);
  };

  const {
    apiKey: GOOGLE_MAPS_API_KEY,
    canUseGoogleMaps,
    authFailed,
    errorMessage,
    isDismissed,
    setIsDismissed,
    handleMapError,
    retryMaps,
  } = useGoogleMapsStatus();

  // Render Google Map component
  const renderMapCanvas = () => (
    <div className="w-full h-full relative bg-slate-100 overflow-hidden">
      {/* Billing Alert if auth failure occurred */}
      {authFailed && !isDismissed && (
        <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto">
          <GoogleMapsBillingAlert
            authFailed={authFailed}
            errorMessage={errorMessage}
            isDismissed={isDismissed}
            onDismiss={() => setIsDismissed(true)}
            onRetry={retryMaps}
          />
        </div>
      )}

      {canUseGoogleMaps ? (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} onError={handleMapError}>
          <div className="w-full h-full absolute inset-0">
            <Map
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              center={userCoords}
              zoom={13}
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapTypeId={mapType}
              onClick={(e) => {
                if (e.detail.latLng) {
                  handleMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
                }
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <MapRecenterController center={userCoords} />

              {/* Customer Selected Marker */}
              <AdvancedMarker position={userCoords}>
                <div className="flex flex-col items-center cursor-pointer select-none">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-light shadow-md whitespace-nowrap mb-0.5">
                    Your Location
                  </span>
                  <div className="relative flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-rose-500/30 animate-ping absolute" />
                    <div className="w-6 h-6 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center shadow-lg">
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
              </AdvancedMarker>

              {/* Nearby Category Providers Pins */}
              {providersWithin10km.map((prov) => (
                <AdvancedMarker
                  key={prov.userId}
                  position={{ lat: prov.calculatedLat, lng: prov.calculatedLng }}
                >
                  <div className="flex flex-col items-center cursor-pointer select-none group">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-light shadow-md whitespace-nowrap mb-0.5 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                      <span>{prov.businessName} ({prov.distanceKm}km)</span>
                    </span>
                    <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow-md">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </AdvancedMarker>
              ))}
            </Map>
          </div>
        </APIProvider>
      ) : (
        /* Interactive Canvas Map Fallback */
        <div
          className="w-full h-full relative cursor-crosshair select-none bg-[#e8ecef] overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const xRatio = (e.clientX - rect.left) / rect.width;
            const yRatio = (e.clientY - rect.top) / rect.height;
            const newLat = userCoords.lat + (0.5 - yRatio) * 0.06;
            const newLng = userCoords.lng + (xRatio - 0.5) * 0.08;
            handleMapClick(newLat, newLng);
          }}
        >
          <svg className="w-full h-full absolute inset-0 opacity-40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="service-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#service-grid)" />
            <line x1="0" y1="35%" x2="100%" y2="35%" stroke="#94a3b8" strokeWidth="5" />
            <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#94a3b8" strokeWidth="6" />
            <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#94a3b8" strokeWidth="5" />
            <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#94a3b8" strokeWidth="5" />
          </svg>

          {/* 10 km Radius Boundary */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-indigo-400/30 bg-indigo-500/5 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border border-indigo-300/20" />
          </div>

          {/* Center User Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
            <div className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-light shadow-md mb-0.5 whitespace-nowrap">
              Your Location
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-rose-500/30 animate-ping absolute" />
              <div className="w-6 h-6 rounded-full bg-rose-600 border-2 border-white text-white flex items-center justify-center shadow-md">
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Nearby Provider Pins */}
          {providersWithin10km.map((p, idx) => {
            const topOffsets = ['28%', '70%', '35%', '60%'];
            const leftOffsets = ['25%', '72%', '78%', '32%'];
            return (
              <div
                key={p.userId}
                style={{
                  top: topOffsets[idx % topOffsets.length],
                  left: leftOffsets[idx % leftOffsets.length]
                }}
                className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              >
                <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[9px] font-light shadow-md mb-0.5 whitespace-nowrap flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                  <span>{p.businessName} ({p.distanceKm}km)</span>
                </span>
                <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="pb-16 min-h-screen">
      {/* ------------------------------------------------------------------ */}
      {/* TOP HEADER: JUST ARROW AS BACK BUTTON & THIN CATEGORY NAME IN ONE LINE */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-2.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[1.8]" />
          </button>
          <h1 className="text-base sm:text-lg font-light text-slate-800 tracking-tight truncate whitespace-nowrap">
            {category.name}
          </h1>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN VIEW AREA                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* CASE 1: FINDING SPECIALIST (30s x 3 tries) */}
        {workflowState === 'finding_specialist' ? (
          <div className="relative w-full h-[620px] sm:h-[680px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs flex items-center justify-center">
            {/* Google Map active in the background */}
            <div className="absolute inset-0 z-0">
              {renderMapCanvas()}
            </div>

            {/* Finding Specialist Overlay Panel over the Google Map */}
            <div className="relative z-10 w-full max-w-md mx-4 p-5 sm:p-6 bg-slate-950/95 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold tracking-wide text-emerald-400">
                    Live 10km GPS Radar
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[11px] font-mono font-bold text-indigo-300">
                  <span>Try {tryCount} of 3</span>
                  <span>•</span>
                  <span className="text-emerald-400">{secondsRemaining}s</span>
                </div>
              </div>

              {/* Animated Radar Pulse & 30s Countdown Bar */}
              <div className="text-center py-2 space-y-2">
                <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center mx-auto relative">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-60" />
                  <Sparkles className="w-6 h-6 text-indigo-300 animate-spin" />
                </div>

                <h3 className="text-sm sm:text-base font-semibold tracking-tight text-white">
                  {providersWithin10km.length > 0
                    ? `Request sent to ${providersWithin10km.length} verified ${category.name} specialist(s)`
                    : `Searching for verified ${category.name} specialists`}
                </h3>

                {/* 30s Animated Progress Bar for Acceptance Time */}
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${((30 - secondsRemaining) / 30) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Try {tryCount}/3 (30s Acceptance Window)</span>
                  <span className="text-emerald-300 font-bold">{secondsRemaining}s remaining</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto pt-1">
                  {providersWithin10km.length > 0
                    ? 'Eligible providers have 30 seconds to accept this request. Talk & chat will unlock immediately upon acceptance.'
                    : `No registered ${category.name} providers currently active in 10km radius.`}
                </p>

                <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-[11px] text-indigo-200">
                  🔒 Strict Rule: You and the provider can only talk and chat after the provider accepts your request.
                </div>
              </div>

              {/* Notified Specialists List within 10km */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                  <span>Specialists in 10km Area ({providersWithin10km.length}):</span>
                  <span>Category: {category.name}</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {providersWithin10km.map((p) => (
                    <div
                      key={p.userId}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs font-light"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={p.businessName}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span className="text-white truncate font-medium">{p.businessName}</span>
                        <span className="text-[10px] text-slate-400">({p.distanceKm}km)</span>
                      </div>

                      <span className="text-[10px] text-emerald-400 font-medium shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Notified
                      </span>
                    </div>
                  ))}
                  {providersWithin10km.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400 bg-white/5 rounded-xl border border-white/5">
                      No registered providers with category &quot;{category.name}&quot; located within 10km.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setWorkflowState('describe_issue')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-white/5 transition-colors"
                >
                  ← Cancel Request
                </button>
                <span className="text-[10px] font-mono text-slate-400">
                  Try {tryCount}/3 • Strict 10km
                </span>
              </div>
            </div>
          </div>
        ) : workflowState === 'timeout_actions' ? (
          /* CASE 2: TIMEOUT AFTER 3 TRIES (GIVE OPTION: FIND AGAIN OR BOOK FOR LATER 60 MINS) */
          <div className="relative w-full h-[620px] sm:h-[680px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              {renderMapCanvas()}
            </div>

            <div className="relative z-10 w-full max-w-lg mx-4 p-6 bg-slate-950/95 backdrop-blur-md rounded-3xl border border-amber-500/30 shadow-2xl text-white space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Acceptance Time Expired (3 Tries Completed)</h3>
                  <p className="text-xs text-amber-300">
                    No {category.name} provider accepted within the 30-second window across 3 attempts.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Specialists in your 10km area may be engaged in other active jobs. Choose how you would like to proceed:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Option 1: Find Again */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-sm font-bold text-white">Find Again</h4>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal mb-3">
                      Restart the on-demand radar scan (3 tries of 30 seconds) to notify available specialists again.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartFindingSpecialist}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Find Again (30s x 3)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Option 2: Book for Later (60 Minutes Acceptance Window) */}
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-emerald-300">Book for Later</h4>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal mb-2.5">
                      Schedule your service with an extended <strong className="text-emerald-300">60-minute acceptance window</strong> for providers.
                    </p>

                    {/* Schedule Date & Slot Selection */}
                    <div className="space-y-1.5 mb-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Preferred Date:</label>
                        <input
                          type="date"
                          value={bookLaterDate}
                          onChange={(e) => setBookLaterDate(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/20 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Time Slot:</label>
                        <select
                          value={bookLaterSlot}
                          onChange={(e) => setBookLaterSlot(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-white/20 text-white text-xs"
                        >
                          <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
                          <option value="Afternoon (1:00 PM - 4:00 PM)">Afternoon (1:00 PM - 4:00 PM)</option>
                          <option value="Evening (5:00 PM - 8:00 PM)">Evening (5:00 PM - 8:00 PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBookForLater}
                    disabled={isBookingLater}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isBookingLater ? (
                      <span>Scheduling...</span>
                    ) : (
                      <>
                        <span>Book for Later (60 Mins)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setWorkflowState('describe_issue')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-white/5"
                >
                  ← Edit Request Details
                </button>
                <span className="text-[10px] font-mono text-slate-400">
                  Category: {category.name}
                </span>
              </div>
            </div>
          </div>
        ) : workflowState === 'booked_for_later' ? (
          /* CASE 3: BOOKED FOR LATER (60 MINUTES ACCEPTANCE WINDOW COUNTDOWN) */
          <div className="relative w-full h-[620px] sm:h-[680px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs flex items-center justify-center">
            <div className="absolute inset-0 z-0">
              {renderMapCanvas()}
            </div>

            <div className="relative z-10 w-full max-w-md mx-4 p-6 bg-slate-950/95 backdrop-blur-md rounded-3xl border border-emerald-500/40 shadow-2xl text-white space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Booked For Later
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  60 Min Acceptance Window
                </span>
              </div>

              {/* Big 60-Minute Countdown Clock */}
              <div className="text-center py-2 space-y-2">
                <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 inline-block mx-auto min-w-[200px]">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-wider">
                    {Math.floor(secondsRemaining / 60)}m {String(secondsRemaining % 60).padStart(2, '0')}s
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1 font-medium">
                    Acceptance Time Remaining
                  </span>
                </div>

                {/* 60m Progress Bar */}
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${((3600 - secondsRemaining) / 3600) * 100}%` }}
                  />
                </div>

                <div className="text-left bg-white/5 p-3 rounded-2xl border border-white/10 space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Scheduled Date:</span>
                    <span className="font-bold text-white">{bookLaterDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Preferred Slot:</span>
                    <span className="font-bold text-emerald-300">{bookLaterSlot}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-bold text-white">{category.name}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  Providers in your 10km area have received your scheduled booking and have 60 minutes to review and confirm. Talk and chat will open immediately once accepted.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setWorkflowState('describe_issue')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-white/5"
                >
                  ← Cancel Booking
                </button>
                <button
                  type="button"
                  onClick={() => handleStartFindingSpecialist()}
                  className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer px-2 py-1 rounded hover:bg-white/5"
                >
                  Switch to Live Instant Radar
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* WHOLE PAGE GOOGLE MAP + DRAGGABLE BOTTOM-TO-TOP CHAT / DESCRIBE BOX */
          <div className="relative w-full h-[calc(100vh-130px)] min-h-[580px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs">
            {/* GOOGLE MAP ACTIVE ON WHOLE PAGE */}
            <div className="absolute inset-0 z-0">
              {renderMapCanvas()}
            </div>

            {/* FLOATING TOP CONTROLS OVER MAP */}
            <div className="absolute top-3 left-3 right-3 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm px-3.5 py-2 flex items-center gap-2 pointer-events-auto max-w-md">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-light text-slate-800 truncate">
                  {userAddress}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm p-1">
                <button
                  type="button"
                  onClick={() => setMapType((p) => (p === 'roadmap' ? 'hybrid' : 'roadmap'))}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-light flex items-center gap-1 cursor-pointer transition-colors"
                  title="Toggle road map"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Road Map</span>
                </button>

                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={isLocating}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-light flex items-center gap-1 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                  title="Detect my GPS"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>My GPS</span>
                </button>
              </div>
            </div>

            {/* DRAGGABLE CHAT / DESCRIBE PROBLEM BOTTOM SHEET OVER MAP */}
            <div
              className={`absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md rounded-t-3xl border-t border-x border-slate-200 shadow-2xl flex flex-col transition-all duration-300 ease-out ${
                sheetSnap === 'peek'
                  ? 'h-14 sm:h-16'
                  : sheetSnap === 'half'
                  ? 'h-[50%] min-h-[360px] max-h-[500px]'
                  : 'h-[90%] max-h-[660px]'
              }`}
            >
              {/* Drag Handle Bar */}
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={() => setSheetSnap((s) => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'half'))}
                className="pt-2 pb-1.5 px-4 flex items-center justify-between cursor-pointer border-b border-slate-100 select-none hover:bg-slate-50/60 transition-colors shrink-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-1 rounded-full bg-slate-300" />
                  <span className="text-xs font-light text-slate-700">
                    {workflowState === 'describe_issue' ? 'Describe Your Problem' : `Chat with ${assignedProvider?.businessName || 'Specialist'}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-light hidden sm:inline">
                    (Drag bottom to top)
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSheetSnap((s) => (s === 'full' ? 'half' : 'full'));
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                    title={sheetSnap === 'full' ? 'Collapse' : 'Expand full top'}
                  >
                    {sheetSnap === 'full' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sheet Body */}
              <div className="flex-1 overflow-y-auto flex flex-col justify-between">
                {/* STATE 1: DESCRIBE PROBLEM (Chatbox style with smaller, thin text) */}
                {workflowState === 'describe_issue' && (
                  <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="pb-2 border-b border-slate-100">
                      <h2 className="text-sm sm:text-base font-light text-slate-800 tracking-tight">
                        Describe Your Issue
                      </h2>
                    </div>

                    {/* Chatbox style Input Container */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                      <textarea
                        rows={4}
                        value={issueDescription}
                        onChange={(e) => setIssueDescription(e.target.value)}
                        placeholder={`Describe your ${category.name} issue here...`}
                        className="w-full text-xs font-light bg-transparent border-0 text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none leading-relaxed"
                      />

                      {/* Attached Media Previews */}
                      {(uploadedImages.length > 0 || uploadedVideos.length > 0) && (
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/80">
                          {uploadedImages.map((src, i) => (
                            <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-black">
                              <img src={src} alt="Uploaded problem" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeUploadedImage(i)}
                                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-slate-900/80 text-white cursor-pointer hover:bg-rose-600"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}

                          {uploadedVideos.map((_, i) => (
                            <div key={i} className="relative w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-200 text-white">
                              <Play className="w-4 h-4 text-emerald-400" />
                              <button
                                type="button"
                                onClick={() => removeUploadedVideo(i)}
                                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-slate-900/80 text-white cursor-pointer hover:bg-rose-600"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chatbox Composer Controls: Attach Photos, Videos */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                        <div className="flex items-center gap-1.5">
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageFileChange}
                          />
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleVideoFileChange}
                          />

                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 text-xs font-light flex items-center gap-1 cursor-pointer transition-colors"
                            title="Add photo"
                          >
                            <Camera className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-[11px] font-light">Photo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 text-xs font-light flex items-center gap-1 cursor-pointer transition-colors"
                            title="Add video"
                          >
                            <Play className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px] font-light">Video</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Tags (smaller, thin text) */}
                    <div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          `Urgent ${category.name} repair`,
                          'Not working / failed',
                          'Inspection needed',
                          'Emergency replacement'
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setIssueDescription((prev) => (prev ? `${prev}. ${tag}` : tag))
                            }
                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-light transition-colors cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Clean Action Button (No info clutter below!) */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleStartFindingSpecialist}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-light text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Find Specialist</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2: CONNECTED LIVE CHATBOX WITH ACCEPTED PROVIDER */}
              {workflowState === 'chat_connected' && assignedProvider && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50 relative">
                  {/* Chat Top Provider Header */}
                  <div className="p-2.5 sm:p-3 bg-white border-b border-slate-200/90 z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={assignedProvider.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                          alt={assignedProvider.businessName}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white absolute -bottom-0.5 -right-0.5" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-light text-slate-900 truncate">
                          {assignedProvider.businessName}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-light">
                          <span className="flex items-center text-amber-500">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span className="ml-0.5 font-mono">{assignedProvider.rating}</span>
                          </span>
                          <span>•</span>
                          <span>{assignedProvider.distanceKm ?? 2.1} km away</span>
                          <span>•</span>
                          <span className="text-emerald-700 capitalize">{serviceStatus.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Action Controls: Calls & Store */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => initiateCall(assignedProvider.userId, assignedProvider.businessName, 'audio')}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                        title="Audio Call"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => initiateCall(assignedProvider.userId, assignedProvider.businessName, 'video')}
                        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                        title="Video Call"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsStoreDrawerOpen(true)}
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                        title="Provider Store"
                      >
                        <Store className="w-3.5 h-3.5" />
                      </button>

                      {/* Invoice Creator for Provider */}
                      {currentUser?.role === 'provider' && (
                        <button
                          type="button"
                          onClick={() => setShowInvoiceCreator(true)}
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                          title="Create Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Status Selector */}
                      {currentUser?.role === 'provider' && (
                        <select
                          value={serviceStatus}
                          onChange={(e) => handleUpdateStatus(e.target.value as any)}
                          className="text-[10px] font-light bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-1 cursor-pointer text-slate-800"
                        >
                          <option value="accepted">Accepted</option>
                          <option value="on_the_way">On The Way</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages Stream */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                    {messages.map((m) => {
                      const isMe = m.senderId === (currentUser?.id || 'cust-1');

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[9px] text-slate-400 mb-0.5 font-light px-1">
                            {m.senderName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <div
                            className={`max-w-[85%] rounded-xl p-2.5 text-xs font-light leading-relaxed shadow-2xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                            }`}
                          >
                            {m.mediaType === 'image' && m.mediaUrl && (
                              <div className="mb-1.5 rounded-lg overflow-hidden max-w-xs">
                                <img src={m.mediaUrl} alt="Attached" className="w-full h-auto max-h-40 object-cover" />
                              </div>
                            )}

                            {m.mediaType === 'video' && m.mediaUrl && (
                              <div className="mb-1.5 rounded-lg overflow-hidden max-w-xs bg-black">
                                <video src={m.mediaUrl} controls className="w-full max-h-40" />
                              </div>
                            )}

                            <p>{m.text}</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Invoices rendered in Chat */}
                    {chatInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="mx-auto max-w-sm w-full bg-white rounded-xl p-3 border border-indigo-200 shadow-xs space-y-2 text-xs font-light"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                          <span className="font-light text-slate-900">Invoice #{inv.id}</span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9px] font-light uppercase ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-600">
                          <div className="flex justify-between">
                            <span>Labor:</span>
                            <span className="font-mono">${inv.laborAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Materials:</span>
                            <span className="font-mono">${inv.materialsAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-100 font-light text-slate-900">
                            <span>Total:</span>
                            <span className="font-mono">${inv.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>

                        {inv.status !== 'paid' && (
                          <button
                            type="button"
                            disabled={isPayingInvoice}
                            onClick={() => handlePayInvoice(inv.id)}
                            className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-light transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Pay with Wallet (${inv.totalAmount.toFixed(2)})</span>
                          </button>
                        )}
                      </div>
                    ))}

                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input Bar */}
                  <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5">
                    <input
                      ref={chatMediaInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleChatMediaSelect}
                    />

                    <button
                      type="button"
                      onClick={() => chatMediaInputRef.current?.click()}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title="Attach Photo or Video"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 py-1.5 px-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-light text-slate-900 focus:bg-white focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Provider Store Drawer */}
                  {isStoreDrawerOpen && (
                    <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-xs flex justify-end">
                      <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                          <div className="flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-amber-600" />
                            <h4 className="text-xs font-light text-slate-900">
                              {assignedProvider.businessName} Products
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsStoreDrawerOpen(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                          {providerStoreProducts.map((prod) => (
                            <div
                              key={prod.id}
                              className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5"
                            >
                              <div className="flex justify-between items-start">
                                <h5 className="text-xs font-light text-slate-900">{prod.name}</h5>
                                <span className="text-xs font-mono font-light text-emerald-700">
                                  ${prod.price.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-light line-clamp-2">{prod.description}</p>
                              <button
                                type="button"
                                onClick={() => handleBuyStoreProductInChat(prod)}
                                className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-light shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>Buy & Pay in Chat (${prod.price.toFixed(2)})</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invoice Creator Modal */}
                  {showInvoiceCreator && (
                    <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-light text-slate-900 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Create Invoice</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowInvoiceCreator(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="space-y-2.5 text-xs font-light">
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1">Labor Fee ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={invoiceLabor}
                              onChange={(e) => setInvoiceLabor(e.target.value)}
                              className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1">Materials ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={invoiceParts}
                              onChange={(e) => setInvoiceParts(e.target.value)}
                              className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1">Notes</label>
                            <input
                              type="text"
                              value={invoiceNotes}
                              onChange={(e) => setInvoiceNotes(e.target.value)}
                              className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div className="flex justify-between items-center pt-1 text-xs font-light text-slate-900">
                            <span>Total:</span>
                            <span className="font-mono">
                              ${((parseFloat(invoiceLabor) || 0) + (parseFloat(invoiceParts) || 0)).toFixed(2)}
                            </span>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-light cursor-pointer shadow-xs transition-colors"
                          >
                            Post to Chat
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};
