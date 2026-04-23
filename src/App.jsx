import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ShoppingBag, User, Heart, PlusCircle, X, Camera, ChevronRight, Trash2, ArrowRight, Tag, Check, Edit3, Lock, CheckCircle, Clock, AlertCircle, LogOut, Settings, Image as ImageIcon, Users, ThumbsUp, UserPlus, UserCheck, ChevronLeft, ChevronRight as ChevronRightIcon, Info, Download, DollarSign, Crop, Move, Maximize2, Minimize2, Ban, MessageSquare, Bell, Phone, CreditCard, Upload, ZoomIn, FileText, HelpCircle, Smartphone, Paperclip, GripVertical, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, onSnapshot, Timestamp, setDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import Cropper from 'react-easy-crop';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Configuración de Firebase ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- Constantes ---
const COMISION = 0.19; // 19% de comisión
const APP_ID = "pijamas";

// Lista inicial de usuarios autorizados para publicar
const INITIAL_AUTHORIZED_SELLERS = [
  "rodrigo.n.arena@hotmail.com",
  "ingridhuck_2006@hotmail.com",
  "ingridcitasony@gmail.com",
"rod.arena7@gmail.com"
];

// Lista de administradores principales
const MAIN_ADMINS = [
  "rodrigo.n.arena@hotmail.com"
];

// CATEGORÍAS para el filtro (solo 4: Pijamas, Pantuflas, Trajes de Baño, Accesorios)
const CATEGORY_FILTERS = [
  { id: 'pijamas', name: 'Pijamas', image: '/pijama.jpg' },
  { id: 'pantuflas', name: 'Pantuflas', image: '/pantuflas.jpeg' },
  { id: 'trajes_baño', name: 'Trajes de Baño', image: '/trajes.png' },
  { id: 'accesorios', name: 'Accesorios', image: '/accesorios.png' }
];

// CATEGORÍAS para la publicación de productos (solo 4 categorías)
const CATEGORIES = [
  { id: 'pijamas', name: 'Pijamas', image: 'https://images.unsplash.com/photo-1527502531437-6e8f7b16f7a5?auto=format&fit=crop&q=80&w=200' },
  { id: 'pantuflas', name: 'Pantuflas', image: 'https://images.unsplash.com/photo-1605274490879-2e12d2d2f1e0?auto=format&fit=crop&q=80&w=200' },
  { id: 'trajes_baño', name: 'Trajes de Baño', image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f67280"%3E%3Cpath d="M20 12c0 4.41-3.59 8-8 8s-8-3.59-8-8 3.59-8 8-8 8 3.59 8 8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"%3E%3C/path%3E%3C/svg%3E' },
  { id: 'accesorios', name: 'Accesorios', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=200' }
];

const CONDITIONS = ["Ropa nueva con etiqueta", "Ropa nueva sin etiqueta", "Ropa como nueva", "Ropa usada"];
const AGE_GROUPS = ["Bebés", "Kids", "Juvenil", "Adulto", "Mayor"];
const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "Único"];

// --- Función de compresión de imágenes ---
const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// --- Componente de imagen arrastrable (SortableItem) ---
const SortableImage = ({ image, index, onRemove, onMoveLeft, onMoveRight, isFirst, isLast }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `image-${index}` });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-24 h-24 rounded-xl bg-slate-100 overflow-hidden group cursor-move"
    >
      <img src={image} alt={`Vista previa ${index + 1}`} className="w-full h-full object-cover" />
      <div {...attributes} {...listeners} className="absolute top-1 left-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical size={12} />
      </div>
      <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMoveLeft(index); }}
          disabled={isFirst}
          className={`bg-black/50 text-white rounded-full p-0.5 ${isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black'}`}
        >
          <ChevronLeft size={12} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMoveRight(index); }}
          disabled={isLast}
          className={`bg-black/50 text-white rounded-full p-0.5 ${isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black'}`}
        >
          <ChevronRightIcon size={12} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// --- Componente de carga de imágenes con Drag & Drop ---
const DraggableImageUploader = ({ images, onImagesChange, maxImages = 5 }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split('-')[1]);
      const newIndex = parseInt(over.id.toString().split('-')[1]);
      const newImages = arrayMove(images, oldIndex, newIndex);
      onImagesChange(newImages);
    }
  };
  
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    
    for (const file of files) {
      if (images.length + newImages.length >= maxImages) break;
      try {
        const compressedImage = await compressImage(file, 1200, 0.7);
        newImages.push(compressedImage);
      } catch (error) {
        console.error('Error comprimiendo imagen:', error);
      }
    }
    
    onImagesChange([...images, ...newImages]);
  };
  
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveLeft = (index) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onImagesChange(newImages);
  };

  const moveRight = (index) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onImagesChange(newImages);
  };
  
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">
        Imágenes del producto (máx. {maxImages}) <span className="text-red-500">*</span>
      </label>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((_, index) => `image-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-4 mb-4">
            {images.map((img, index) => (
              <SortableImage
                key={`image-${index}`}
                image={img}
                index={index}
                onRemove={removeImage}
                onMoveLeft={moveLeft}
                onMoveRight={moveRight}
                isFirst={index === 0}
                isLast={index === images.length - 1}
              />
            ))}
            
            {images.length < maxImages && (
              <label className="w-24 h-24 rounded-xl bg-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                <Camera size={24} className="text-slate-400" />
                <span className="text-[8px] text-slate-400 mt-1">Agregar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </SortableContext>
      </DndContext>
      
      <p className="text-[8px] text-slate-400 mt-1">
        Arrastra las imágenes o usa las flechas para reordenarlas. Se comprimirán automáticamente.
      </p>
    </div>
  );
};

export default function App() {
  // --- Tutorial de cómo descargar la app en iPhone ---
  const [showDownloadTutorial, setShowDownloadTutorial] = useState(false);

  // --- PWA Installation Prompt ---
  useEffect(() => {
    let deferredPrompt;
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setTimeout(() => {
        showInstallPrompt(deferredPrompt);
      }, 3000);
    };

    const showInstallPrompt = (deferredPrompt) => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
      }

      const modal = document.createElement('div');
      modal.className = 'fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-[#f67280] z-[1000] p-6 animate-slide-up';
      modal.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
          <img src="/pijamas.png" alt="Pijamas" class="w-12 h-12 rounded-xl" />
          <div>
            <h3 class="font-bold text-lg">Instalar Pijamas</h3>
            <p class="text-xs text-slate-500">Accede más rápido a tu tienda favorita</p>
          </div>
        </div>
        <p class="text-sm text-slate-600 mb-6">Instala nuestra app para una experiencia más rápida y poder comprar incluso sin conexión.</p>
        <div class="flex gap-3">
          <button id="install-cancel" class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
            Ahora no
          </button>
          <button id="install-confirm" class="flex-1 bg-[#f67280] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#355c7d] transition-all">
            Instalar
          </button>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('install-cancel').addEventListener('click', () => {
        modal.remove();
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      });

      document.getElementById('install-confirm').addEventListener('click', async () => {
        modal.remove();
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('Resultado de instalación:', outcome);
          deferredPrompt = null;
        }
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Detectar cuando la app se instala
  useEffect(() => {
    window.addEventListener('appinstalled', () => {
      console.log('App instalada exitosamente');
      alert('¡Gracias por instalar Pijamas! 🎉');
    });
  }, []);

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registrado:', registration);
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('Nueva versión detectada');
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showUpdatePrompt(registration);
                }
              });
            });
          })
          .catch(error => {
            console.error('Error registrando Service Worker:', error);
          });
      });
    }
  }, []);

  // Función para mostrar prompt de actualización
  const showUpdatePrompt = (registration) => {
    const modal = document.createElement('div');
    modal.className = 'fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-[#355c7d] z-[1000] p-6 animate-slide-up';
    modal.innerHTML = `
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-[#f8b195]/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-[#355c7d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-lg">Nueva versión disponible</h3>
          <p class="text-xs text-slate-500">Actualiza para tener la última versión</p>
        </div>
      </div>
      <div class="flex gap-3">
        <button id="update-later" class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
          Después
        </button>
        <button id="update-now" class="flex-1 bg-[#f67280] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#355c7d] transition-all">
          Actualizar ahora
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('update-later').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('update-now').addEventListener('click', () => {
      modal.remove();
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    });
  };

  // Agregar estilos para la animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slide-up {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-up {
      animation: slide-up 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);

  // Estados principales
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [authorizedSellers, setAuthorizedSellers] = useState(INITIAL_AUTHORIZED_SELLERS);
  
  // Estados de modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isBuyersPanelOpen, setIsBuyersPanelOpen] = useState(false);
  const [isAuthorizedUsersModalOpen, setIsAuthorizedUsersModalOpen] = useState(false);
  
  // Estados de edición y selección
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedTab, setSelectedTab] = useState('publicaciones');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const fileInputRef = useRef(null);
  
  // Estados para búsqueda de usuarios en admin panel
  const [searchUserTerm, setSearchUserTerm] = useState("");
  const [newAuthorizedEmail, setNewAuthorizedEmail] = useState("");

  // Estados para comprobantes
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptZoom, setReceiptZoom] = useState(1);
  const [buyers, setBuyers] = useState({});

  // Estados para recorte de imagen
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropType, setCropType] = useState(null);

  // Estados para el Banner SALE y Administración (incluye descuentos)
  const [saleClicks, setSaleClicks] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  
  // Cargar estado del banner desde localStorage (por defecto desactivado)
  const [saleConfig, setSaleConfig] = useState(() => {
    const saved = localStorage.getItem('pijamas_saleConfig');
    if (saved) return JSON.parse(saved);
    return {
      title: "¡GRAN LIQUIDACIÓN DE TEMPORADA!",
      promo: "50",
      textoAdicional: "¡No te lo pierdas!",
      fechaFin: "2025-12-31",
      active: false
    };
  });

  // Descuentos por categoría (inicialmente vacío)
  const [categoryDiscounts, setCategoryDiscounts] = useState(() => {
    const saved = localStorage.getItem('pijamas_categoryDiscounts');
    return saved ? JSON.parse(saved) : {};
  });

  // Guardar estado del banner y descuentos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('pijamas_saleConfig', JSON.stringify(saleConfig));
  }, [saleConfig]);
  useEffect(() => {
    localStorage.setItem('pijamas_categoryDiscounts', JSON.stringify(categoryDiscounts));
  }, [categoryDiscounts]);

  // Función para obtener el porcentaje de descuento aplicable a un producto
  const getDiscountPercentForProduct = (product) => {
    if (!saleConfig.active) return 0;
    if (categoryDiscounts[product.category]) {
      return categoryDiscounts[product.category];
    }
    const globalDiscount = parseFloat(saleConfig.promo);
    return isNaN(globalDiscount) ? 0 : globalDiscount;
  };

  // Función para obtener precio con descuento
  const getDiscountedPrice = (product) => {
    const discountPercent = getDiscountPercentForProduct(product);
    if (discountPercent <= 0) return { original: product.price, discounted: product.price, hasDiscount: false };
    const discounted = product.price * (1 - discountPercent / 100);
    return { original: product.price, discounted: Math.round(discounted), hasDiscount: true };
  };

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);

  // Estados para seguidores y likes recibidos
  const [followers, setFollowers] = useState({});
  const [following, setFollowing] = useState({});
  const [productLikes, setProductLikes] = useState({});

  // Nuevo Producto (sin género)
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    size: "M",
    images: [],
    condition: "Ropa usada",
    category: "pijamas",
    ageGroup: "Adulto",
    cuotas: "",
    whatsappNumber: "",
    shoulderToShoulder: "",
    armpitToArmpit: "",
    length: "",
    waist: "",
    hip: "",
    inseam: "",
    outseam: "",
    sold: false,
    buyerId: null,
    soldAt: null
  });

  // Perfil del usuario
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    avatar: "",
    coverImage: "",
    whatsappNumber: "",
    totalEarned: 0
  });

  // Cargar usuarios autorizados desde Firestore
  useEffect(() => {
    const loadAuthorizedSellers = async () => {
      const authRef = collection(db, "authorizedSellers");
      const snapshot = await getDocs(authRef);
      if (!snapshot.empty) {
        const emails = snapshot.docs.map(doc => doc.data().email);
        setAuthorizedSellers(emails);
      } else {
        INITIAL_AUTHORIZED_SELLERS.forEach(async (email) => {
          await addDoc(collection(db, "authorizedSellers"), { email });
        });
      }
    };
    loadAuthorizedSellers();
  }, []);

  // Cargar datos desde Firestore (solo para APP_ID = "pijamas")
  useEffect(() => {
    // Productos publicados (incluyendo vendidos) - SOLO de esta app
    const publishedUnsubscribe = onSnapshot(
      query(collection(db, "products"), where("status.publicada", "==", true), where("appId", "==", APP_ID)),
      (snapshot) => {
        const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsList);
      }
    );

    // Productos pendientes - SOLO de esta app
    const pendingUnsubscribe = onSnapshot(
      query(collection(db, "products"), where("status.publicada", "==", false), where("appId", "==", APP_ID)),
      (snapshot) => {
        const pendingList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingProducts(pendingList);
      }
    );

    // Cargar usuarios (sin filtro de app, son globales)
    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersMap = {};
      snapshot.docs.forEach(doc => {
        usersMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      setUsers(usersMap);
    });

    // Cargar seguidores (globales)
    const followersUnsubscribe = onSnapshot(collection(db, "followers"), (snapshot) => {
      const followersMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!followersMap[data.userId]) {
          followersMap[data.userId] = [];
        }
        followersMap[data.userId].push(data.followerId);
      });
      setFollowers(followersMap);
    });

    // Cargar following (globales)
    const followingUnsubscribe = onSnapshot(collection(db, "following"), (snapshot) => {
      const followingMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!followingMap[data.userId]) {
          followingMap[data.userId] = [];
        }
        followingMap[data.userId].push(data.followingId);
      });
      setFollowing(followingMap);
    });

    // Cargar preguntas (filtramos por productos de esta app)
    const questionsUnsubscribe = onSnapshot(
      query(collection(db, "questions"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const allQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const productIds = [...products, ...pendingProducts].map(p => p.id);
        const filteredQuestions = allQuestions.filter(q => productIds.includes(q.productId));
        setQuestions(filteredQuestions);
      }
    );

    // Cargar notificaciones (globales, pero se muestran según usuario)
    const notificationsUnsubscribe = onSnapshot(
      query(collection(db, "notifications"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const notificationsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notificationsList);
        if (user) {
          const unread = notificationsList.filter(n => !n.read && n.userId === user.uid).length;
          setUnreadNotifications(unread);
        }
      }
    );

    // Cargar comprobantes (globales)
    const receiptsUnsubscribe = onSnapshot(
      query(collection(db, "receipts"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const receiptsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReceipts(receiptsList);
      }
    );

    // Cargar usuarios autorizados (globales)
    const authorizedUnsubscribe = onSnapshot(collection(db, "authorizedSellers"), (snapshot) => {
      const emails = snapshot.docs.map(doc => doc.data().email);
      setAuthorizedSellers(emails);
    });

    return () => {
      publishedUnsubscribe();
      pendingUnsubscribe();
      usersUnsubscribe();
      followersUnsubscribe();
      followingUnsubscribe();
      questionsUnsubscribe();
      notificationsUnsubscribe();
      receiptsUnsubscribe();
      authorizedUnsubscribe();
    };
  }, [user, products, pendingProducts]);

  // Efecto para monitorear el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", firebaseUser.uid)));
        
        const isMainAdmin = MAIN_ADMINS.includes(firebaseUser.email);
        const authSnapshot = await getDocs(collection(db, "authorizedSellers"));
        const emails = authSnapshot.docs.map(doc => doc.data().email);
        const canPublishValue = isMainAdmin || emails.includes(firebaseUser.email);
        
        if (!userDoc.empty) {
          const existingUser = userDoc.docs[0].data();
          const updatedUser = {
            ...existingUser,
            canPublish: canPublishValue,
            isMainAdmin: isMainAdmin,
            isAdmin: isMainAdmin || existingUser.isAdmin
          };
          setUser(updatedUser);
          setProfileData({
            name: existingUser.name,
            bio: existingUser.bio || "",
            avatar: existingUser.avatar || firebaseUser.photoURL,
            coverImage: existingUser.coverImage || "",
            whatsappNumber: existingUser.whatsappNumber || "",
            totalEarned: existingUser.totalEarned || 0
          });
        } else {
          const newUser = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "Usuario",
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + firebaseUser.uid,
            followers: 0,
            following: 0,
            bio: "",
            coverImage: "",
            whatsappNumber: "",
            totalEarned: 0,
            isAdmin: isMainAdmin,
            isMainAdmin: isMainAdmin,
            canPublish: canPublishValue
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newUser);
          setUser(newUser);
          setProfileData({
            name: newUser.name,
            bio: "",
            avatar: newUser.avatar,
            coverImage: "",
            whatsappNumber: "",
            totalEarned: 0
          });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      alert("Error al iniciar sesión. Por favor, intenta de nuevo.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      name: profileData.name,
      bio: profileData.bio,
      avatar: profileData.avatar,
      coverImage: profileData.coverImage,
      whatsappNumber: profileData.whatsappNumber
    });
    setUser(prev => ({
      ...prev,
      name: profileData.name,
      avatar: profileData.avatar,
      bio: profileData.bio,
      coverImage: profileData.coverImage,
      whatsappNumber: profileData.whatsappNumber
    }));
    setIsEditProfileOpen(false);
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImage(reader.result);
        setCropType(type);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(cropImage, croppedAreaPixels);
      if (cropType === 'avatar') {
        setProfileData(prev => ({ ...prev, avatar: croppedImage }));
      } else if (cropType === 'cover') {
        setProfileData(prev => ({ ...prev, coverImage: croppedImage }));
      }
      setIsCropModalOpen(false);
      setCropImage(null);
    } catch (e) {
      console.error('Error al recortar imagen:', e);
    }
  };

  const getCroppedImg = (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        resolve(canvas.toDataURL('image/jpeg'));
      };
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Debes iniciar sesión para publicar");
      return;
    }

    if (!user.canPublish && !user.isMainAdmin) {
      alert("No tienes permiso para publicar productos. Contacta al administrador.");
      return;
    }

    if (newProduct.images.length === 0) {
      alert("Debes subir al menos una imagen del producto");
      return;
    }

    if (!newProduct.title.trim()) {
      alert("Debes ingresar un título");
      return;
    }

    if (!newProduct.price) {
      alert("Debes ingresar un precio");
      return;
    }

    if (!newProduct.size) {
      alert("Debes seleccionar un talle");
      return;
    }

    if (!newProduct.whatsappNumber) {
      alert("Debes ingresar un número de WhatsApp para recibir notificaciones de venta");
      return;
    }

    const precio = parseInt(newProduct.price);
    const montoNeto = precio - (precio * COMISION);
    const comisionMonto = precio * COMISION;

    const productToAdd = {
      appId: APP_ID,
      userId: user.uid,
      user: {
        name: user.name,
        avatar: user.avatar
      },
      images: newProduct.images,
      title: newProduct.title,
      description: newProduct.description,
      price: precio,
      montoNeto: montoNeto,
      comisionMonto: comisionMonto,
      size: newProduct.size,
      condition: newProduct.condition,
      category: newProduct.category,
      ageGroup: newProduct.ageGroup,
      gender: "Mujer",
      cuotas: (newProduct.cuotas && parseInt(newProduct.cuotas) > 0) ? (newProduct.cuotas + " cuotas sin interés") : "",
      whatsappNumber: newProduct.whatsappNumber,
      shoulderToShoulder: newProduct.shoulderToShoulder,
      armpitToArmpit: newProduct.armpitToArmpit,
      length: newProduct.length,
      waist: newProduct.waist,
      hip: newProduct.hip,
      inseam: newProduct.inseam,
      outseam: newProduct.outseam,
      likes: 0,
      likedBy: [],
      sold: false,
      buyerId: null,
      soldAt: null,
      status: {
        iniciada: true,
        verificada: false,
        aprobada: false,
        publicada: false
      },
      createdAt: Timestamp.now()
    };

    const productRef = await addDoc(collection(db, "products"), productToAdd);

    await addDoc(collection(db, "notifications"), {
      userId: user.uid,
      type: "product_pending",
      title: "Producto enviado para revisión",
      message: `Tu producto "${newProduct.title}" está siendo revisado por nuestros administradores.`,
      productId: productRef.id,
      productImage: newProduct.images[0],
      read: false,
      createdAt: Timestamp.now()
    });

    const adminUsers = await getDocs(query(collection(db, "users"), where("isAdmin", "==", true)));
    
    adminUsers.docs.forEach(async (adminDoc) => {
      await addDoc(collection(db, "notifications"), {
        userId: adminDoc.id,
        type: "new_product_pending",
        title: "Nuevo producto para revisar",
        message: `${user.name} ha publicado "${newProduct.title}" para revisión.`,
        productId: productRef.id,
        productImage: newProduct.images[0],
        read: false,
        createdAt: Timestamp.now()
      });
    });

    setIsModalOpen(false);
    
    setNewProduct({
      title: "",
      description: "",
      price: "",
      size: "M",
      images: [],
      condition: "Ropa usada",
      category: "pijamas",
      ageGroup: "Adulto",
      cuotas: "",
      whatsappNumber: "",
      shoulderToShoulder: "",
      armpitToArmpit: "",
      length: "",
      waist: "",
      hip: "",
      inseam: "",
      outseam: ""
    });

    alert("✅ ¡Producto enviado para revisión! Recibirás una notificación cuando sea aprobado.");
  };

  const handlePublishProduct = async (productId) => {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      'status.publicada': true,
      'status.aprobada': true
    });

    const product = pendingProducts.find(p => p.id === productId);
    if (product) {
      await addDoc(collection(db, "notifications"), {
        userId: product.userId,
        type: "product_approved",
        title: "¡Producto aprobado!",
        message: `Tu producto "${product.title}" ha sido aprobado y ya está visible en el catálogo.`,
        productId: productId,
        productImage: product.images ? product.images[0] : product.image,
        read: false,
        createdAt: Timestamp.now()
      });
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsEditProductOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const isAdmin = user?.isAdmin;
    const productRef = doc(db, "products", editingProduct.id);
    const precio = parseInt(editingProduct.price);
    const montoNeto = precio - (precio * COMISION);
    const comisionMonto = precio * COMISION;

    const updatedProduct = {
      ...editingProduct,
      images: editingProduct.images || [editingProduct.image],
      montoNeto: montoNeto,
      comisionMonto: comisionMonto,
      cuotas: (editingProduct.cuotas && parseInt(editingProduct.cuotas) > 0) ? (editingProduct.cuotas + " cuotas sin interés") : "",
      status: isAdmin ? editingProduct.status : {
        iniciada: true,
        verificada: false,
        aprobada: false,
        publicada: false
      }
    };

    await updateDoc(productRef, updatedProduct);
    setIsEditProductOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      await deleteDoc(doc(db, "products", productId));
      
      const questionsQuery = query(collection(db, "questions"), where("productId", "==", productId));
      const questionsSnapshot = await getDocs(questionsQuery);
      questionsSnapshot.docs.forEach(async (questionDoc) => {
        await deleteDoc(questionDoc.ref);
      });
    }
  };

  const toggleSoldStatus = async (productId, currentSold) => {
    const productRef = doc(db, "products", productId);
    const newSold = !currentSold;
    const updateData = { sold: newSold };
    if (!newSold) {
      updateData.buyerId = null;
      updateData.soldAt = null;
    } else {
      updateData.soldAt = Timestamp.now();
    }
    await updateDoc(productRef, updateData);
  };

  // Modificada para aceptar precio final (con descuento)
  const handleMarkAsSold = async (productId, buyerId, paymentMethod = 'mercadopago', finalPrice = null) => {
    if (window.confirm("¿Marcar esta prenda como vendida?")) {
      const productRef = doc(db, "products", productId);
      const product = [...products, ...pendingProducts].find(p => p.id === productId);
      const priceToUse = finalPrice !== null ? finalPrice : product.price;
      const comisionMonto = priceToUse * COMISION;
      const montoNeto = priceToUse - comisionMonto;
      
      await updateDoc(productRef, {
        sold: true,
        buyerId: buyerId,
        soldAt: Timestamp.now(),
        paymentMethod: paymentMethod,
        price: priceToUse,
        montoNeto: montoNeto,
        comisionMonto: comisionMonto
      });

      const sellerRef = doc(db, "users", product.userId);
      await updateDoc(sellerRef, {
        totalEarned: increment(montoNeto)
      });

      await addDoc(collection(db, "notifications"), {
        userId: product.userId,
        type: "sale",
        title: "¡Producto vendido!",
        message: `Tu producto "${product.title}" ha sido vendido. Prepara el envío.`,
        productId: productId,
        productImage: product.images ? product.images[0] : product.image,
        read: false,
        createdAt: Timestamp.now()
      });

      if (product.whatsappNumber) {
        const mensaje = encodeURIComponent(
          `¡Hola ${product.user.name}! Tu producto "${product.title}" ha sido vendido en Pijamas.\n\n` +
          `Precio de venta: $${priceToUse.toLocaleString()}\n` +
          `Neto a cobrar (después de comisión del 19%): $${montoNeto.toLocaleString()}\n\n` +
          `Por favor, prepara el producto para su envío. En breve recibirás instrucciones de despacho.\n\n` +
          `Gracias por vender con Pijamas.`
        );
        window.open(`https://wa.me/${product.whatsappNumber}?text=${mensaje}`, "_blank");
      }

      await addDoc(collection(db, "notifications"), {
        userId: buyerId,
        type: "purchase",
        title: "¡Compra exitosa!",
        message: `Has comprado "${product.title}" exitosamente. El vendedor será notificado.`,
        productId: productId,
        productImage: product.images ? product.images[0] : product.image,
        read: false,
        createdAt: Timestamp.now()
      });
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedReceipt = await compressImage(file, 1000, 0.6);
      
      // Calcular precios finales con descuento para cada item del carrito
      const cartWithDiscount = cart.map(item => {
        const { discounted } = getDiscountedPrice(item);
        return { ...item, finalPrice: discounted };
      });
      const totalConDescuento = cartWithDiscount.reduce((sum, item) => sum + item.finalPrice, 0);
      
      const receiptData = {
        userId: user.uid,
        userName: user.name,
        userAvatar: user.avatar,
        cart: cartWithDiscount.map(item => ({
          id: item.id,
          title: item.title,
          price: item.finalPrice,
          originalPrice: item.price,
          size: item.size
        })),
        total: totalConDescuento,
        receipt: compressedReceipt,
        receiptName: file.name,
        createdAt: Timestamp.now(),
        processed: false
      };

      await addDoc(collection(db, "receipts"), receiptData);
      
      // Marcar cada producto como vendido
      for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const { discounted } = getDiscountedPrice(item);
        await handleMarkAsSold(item.id, user.uid, 'transferencia', discounted);
      }

      setCart([]);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(false);
      alert("¡Comprobante subido con éxito! Los productos han sido marcados como vendidos. El administrador se comunicará contigo para coordinar la entrega.");
      
      // Redirigir a WhatsApp con el número indicado
      const mensajeFinal = encodeURIComponent("¡Hola! Realicé una compra en Pijamas y ya subí el comprobante.");
      window.open(`https://wa.me/5491128711097?text=${mensajeFinal}`, "_blank");
    } catch (error) {
      console.error('Error procesando comprobante:', error);
      alert("Error al procesar el comprobante. Intenta nuevamente.");
    }
  };

  const handleSaleBannerClick = () => {
    const newCount = saleClicks + 1;
    setSaleClicks(newCount);
    if (newCount === 7) {
      setShowPinModal(true);
      setSaleClicks(0);
    }
  };

  const handleLogoClick = () => {
    const newCount = saleClicks + 1;
    setSaleClicks(newCount);
    if (newCount === 7) {
      setShowPinModal(true);
      setSaleClicks(0);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === "0505") {
      setShowPinModal(false);
      setShowAdminModal(true);
      setPinInput("");
    } else {
      alert("PIN Incorrecto");
      setPinInput("");
      setSaleClicks(0);
      setShowPinModal(false);
    }
  };

  const handleStatusChange = async (productId, statusType) => {
    const productRef = doc(db, "products", productId);
    const update = {};
    if (statusType === 'verificada') {
      update['status.verificada'] = true;
    } else if (statusType === 'aprobada') {
      update['status.aprobada'] = true;
    }
    await updateDoc(productRef, update);
  };

  const handleFollow = async (userIdToFollow) => {
    if (!user) {
      alert("Debes iniciar sesión para seguir usuarios");
      return;
    }

    const isCurrentlyFollowing = following[user.uid]?.includes(userIdToFollow);

    if (isCurrentlyFollowing) {
      const q = query(
        collection(db, "followers"),
        where("userId", "==", userIdToFollow),
        where("followerId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      const q2 = query(
        collection(db, "following"),
        where("userId", "==", user.uid),
        where("followingId", "==", userIdToFollow)
      );
      const snapshot2 = await getDocs(q2);
      snapshot2.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
    } else {
      await addDoc(collection(db, "followers"), {
        userId: userIdToFollow,
        followerId: user.uid,
        createdAt: Timestamp.now()
      });
      await addDoc(collection(db, "following"), {
        userId: user.uid,
        followingId: userIdToFollow,
        createdAt: Timestamp.now()
      });
    }
  };

  const toggleLike = async (id) => {
    if (!user) {
      alert("Debes iniciar sesión para dar like");
      return;
    }

    const product = [...products, ...pendingProducts].find(p => p.id === id);
    if (!product) return;

    const isLiked = product.likedBy?.includes(user.uid) || false;
    const productRef = doc(db, "products", id);

    if (isLiked) {
      await updateDoc(productRef, {
        likes: product.likes - 1,
        likedBy: product.likedBy.filter(uid => uid !== user.uid)
      });
      setFavorites(prev => prev.filter(pId => pId !== id));
    } else {
      await updateDoc(productRef, {
        likes: product.likes + 1,
        likedBy: [...(product.likedBy || []), user.uid]
      });
      setFavorites(prev => [...prev, id]);
    }
  };

  const addToCart = (product) => {
    if (!user) {
      alert("Debes iniciar sesión para comprar");
      return;
    }

    if (product.userId === user.uid) {
      alert("No puedes comprar tu propio producto");
      return;
    }

    if (product.sold) {
      alert("Este producto ya fue vendido");
      return;
    }

    if (cart.find(item => item.id === product.id)) {
      setIsCartOpen(true);
      return;
    }

    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  const handlePayment = () => {
    // Calcular total con descuento del banner
    const cartWithDiscount = cart.map(item => {
      const { discounted } = getDiscountedPrice(item);
      return { ...item, finalPrice: discounted };
    });
    const totalConDescuento = cartWithDiscount.reduce((sum, item) => sum + item.finalPrice, 0);
    
    // Abrir MercadoPago con el nuevo link
    window.open(`https://link.mercadopago.com.ar/ihpijamas?amount=${totalConDescuento}`, "_blank");
    
    let productosTexto = "";
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const { discounted } = getDiscountedPrice(item);
      productosTexto = productosTexto + "- " + item.title + " (Talle: " + item.size + ") - $" + discounted;
      if (i < cart.length - 1) {
        productosTexto = productosTexto + "\n";
      }
    }

    const mensaje = encodeURIComponent(
      "¡Hola! Realicé una compra en Pijamas:\n\n" +
      productosTexto +
      "\n\nTotal: $" + totalConDescuento +
      "\n\nTe adjunto el comprobante de pago."
    );

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const { discounted } = getDiscountedPrice(item);
      handleMarkAsSold(item.id, user.uid, 'mercadopago', discounted);
    }

    // Redirigir al número de WhatsApp indicado
    window.open(`https://wa.me/5491128711097?text=${mensaje}`, "_blank");

    setCart([]);
    setIsCartOpen(false);
  };

  const handleTransferPayment = () => {
    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleAskQuestion = async (productId) => {
    if (!user) {
      alert("Debes iniciar sesión para hacer una pregunta");
      return;
    }

    if (!newQuestion.trim()) {
      alert("Por favor escribe tu pregunta");
      return;
    }

    await addDoc(collection(db, "questions"), {
      productId,
      userId: user.uid,
      userName: user.name,
      userAvatar: user.avatar,
      question: newQuestion,
      answer: "",
      answeredAt: null,
      createdAt: Timestamp.now()
    });

    setNewQuestion("");
  };

  const handleAnswerQuestion = async (questionId) => {
    if (!newAnswer.trim()) {
      alert("Por favor escribe tu respuesta");
      return;
    }

    const questionRef = doc(db, "questions", questionId);
    await updateDoc(questionRef, {
      answer: newAnswer,
      answeredAt: Timestamp.now()
    });

    setNewAnswer("");
    setSelectedQuestion(null);
  };

  const markNotificationAsRead = async (notificationId) => {
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, { read: true });
  };

  const markAllNotificationsAsRead = async () => {
    const userNotifications = notifications.filter(n => n.userId === user?.uid && !n.read);
    userNotifications.forEach(async (notif) => {
      const notifRef = doc(db, "notifications", notif.id);
      await updateDoc(notifRef, { read: true });
    });
  };

  const handleAddAuthorizedUser = async () => {
    if (!newAuthorizedEmail.trim()) {
      alert("Ingresa un email válido");
      return;
    }
    
    if (!newAuthorizedEmail.includes('@')) {
      alert("Ingresa un email válido");
      return;
    }

    if (authorizedSellers.includes(newAuthorizedEmail)) {
      alert("Este email ya está autorizado");
      return;
    }

    await addDoc(collection(db, "authorizedSellers"), { email: newAuthorizedEmail });
    setNewAuthorizedEmail("");
  };

  const handleRemoveAuthorizedUser = async (email) => {
    if (MAIN_ADMINS.includes(email)) {
      alert("No puedes eliminar a un administrador principal");
      return;
    }

    const q = query(collection(db, "authorizedSellers"), where("email", "==", email));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  };

  const getUserProducts = (userId) => {
    return [...products, ...pendingProducts].filter(p => p.userId === userId);
  };

  const getUserQuestions = (userId) => {
    const userProducts = getUserProducts(userId);
    const userProductIds = userProducts.map(p => p.id);
    return questions.filter(q => userProductIds.includes(q.productId));
  };

  const getUserNotifications = () => {
    if (!user) return [];
    return notifications.filter(n => n.userId === user.uid);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !selectedCategoryFilter || p.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryFilter]);

  const cartTotal = cart.reduce((sum, item) => {
    const { discounted } = getDiscountedPrice(item);
    return sum + discounted;
  }, 0);
  const cartTotalWithDiscount = cartTotal * 0.95;

  const isFollowing = (userId) => {
    return following[user?.uid]?.includes(userId) || false;
  };
  const getFollowersCount = (userId) => {
    return followers[userId]?.length || 0;
  };
  const getFollowingCount = (userId) => {
    return following[userId]?.length || 0;
  };
  const getLikesReceived = (userId) => {
    const userProducts = [...products, ...pendingProducts].filter(p => p.userId === userId);
    return userProducts.reduce((total, p) => total + (p.likes || 0), 0);
  };
  const getUserTotalEarned = (userId) => {
    const userProducts = [...products, ...pendingProducts].filter(p => p.userId === userId && p.sold);
    return userProducts.reduce((total, p) => total + (p.montoNeto || 0), 0);
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedProduct) {
      const images = selectedProduct.images || [selectedProduct.image];
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (selectedProduct) {
      const images = selectedProduct.images || [selectedProduct.image];
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const downloadImage = (imageUrl, fileName) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName || 'imagen.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadReceipt = (receiptUrl, fileName) => {
    const link = document.createElement('a');
    link.href = receiptUrl;
    link.download = fileName || 'comprobante.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getProductQuestions = (productId) => {
    return questions.filter(q => q.productId === productId);
  };

  return (
    <div className="min-h-screen bg-[#f8b195]/10 font-sans text-[#355c7d] pb-20 selection:bg-[#f67280]/30">
      {/* --- Tutorial de descarga en iPhone --- */}
      {showDownloadTutorial && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/80 backdrop-blur-sm" onClick={() => setShowDownloadTutorial(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Smartphone className="text-[#f67280]" size={28} />
                Instalar en iPhone
              </h3>
              <button onClick={() => setShowDownloadTutorial(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#355c7d] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-bold mb-1">Abrí Safari</p>
                  <p className="text-sm text-slate-600">Esta función solo está disponible en el navegador Safari de iPhone.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#355c7d] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-bold mb-1">Tocá el botón Compartir</p>
                  <p className="text-sm text-slate-600">Es el ícono rectangular con una flecha hacia arriba, en la parte inferior de la pantalla.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#355c7d] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-bold mb-1">Seleccioná "Agregar a Inicio"</p>
                  <p className="text-sm text-slate-600">Desplazate hacia abajo en el menú y elegí "Agregar a la pantalla de inicio".</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#355c7d] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <p className="font-bold mb-1">Confirmá la instalación</p>
                  <p className="text-sm text-slate-600">Tocá "Agregar" en la esquina superior derecha y la app aparecerá en tu pantalla de inicio.</p>
                </div>
              </div>

              <button
                onClick={() => setShowDownloadTutorial(false)}
                className="w-full bg-[#f67280] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#355c7d] transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Banner SALE! Administrable --- */}
      {saleConfig.active && (
        <div
          onClick={handleSaleBannerClick}
          className="bg-[#f67280] text-white py-2 px-4 text-center cursor-pointer select-none transition-all hover:bg-[#355c7d] active:scale-95"
        >
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
            <span className="font-black italic tracking-tighter text-lg">{saleConfig.title}</span>
            <span className="bg-white text-[#f67280] px-3 py-0.5 rounded-full font-bold text-xs uppercase tracking-widest animate-pulse">
              {saleConfig.promo}% OFF
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">
              {saleConfig.fechaFin && `Válido hasta ${new Date(saleConfig.fechaFin).toLocaleDateString()}`}
              {saleConfig.textoAdicional && ` · ${saleConfig.textoAdicional}`}
            </span>
          </div>
        </div>
      )}

      {/* --- Navegación --- */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#c06c84]/20">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={handleLogoClick}>
            <div className="flex items-center gap-1">
              <span className="text-2xl md:text-3xl font-serif tracking-[0.2em] font-light group-hover:text-[#f67280] transition-colors uppercase whitespace-nowrap">Pijamas</span>
              <img src="/logoih.png" alt="Logo IH" className="h-[80px] w-auto object-contain" />
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-lg mx-12 relative group">
            <input
              type="text"
              placeholder="¿Qué estás buscando hoy?..."
              className="w-full bg-[#f8b195]/10 rounded-full py-3 px-12 text-sm focus:ring-1 focus:ring-[#f67280] outline-none transition-all border border-transparent focus:bg-white focus:border-[#c06c84] shadow-inner text-[#355c7d]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-3 text-[#6c5b7b] group-focus-within:text-[#f67280] transition-colors" size={18} />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDownloadTutorial(true)}
              className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#6c5b7b] hover:text-[#355c7d] transition-colors"
              title="Cómo instalar la app en iPhone"
            >
              <Smartphone size={18} />
              <span>App</span>
            </button>

            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-[#6c5b7b] hover:text-[#355c7d] transition-colors"
            >
              <Bell size={22} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#f67280] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
              {isNotificationsOpen && user && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#c06c84]/20 overflow-hidden z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 bg-gradient-to-r from-[#f67280] to-[#c06c84] text-white sticky top-0 flex justify-between items-center">
                    <h3 className="font-bold">Notificaciones</h3>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[8px] bg-white/20 px-2 py-1 rounded-full"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="divide-y">
                    {getUserNotifications().map(notif => (
                      <div
                        key={notif.id}
                        className={`p-4 cursor-pointer hover:bg-[#f8b195]/10 transition-colors ${!notif.read ? 'bg-[#f8b195]/20' : ''}`}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.productId) {
                            const product = [...products, ...pendingProducts].find(p => p.id === notif.productId);
                            if (product) {
                              openProductModal(product);
                            }
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          {notif.productImage && (
                            <img src={notif.productImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-bold text-sm">{notif.title}</h4>
                            <p className="text-xs text-[#6c5b7b]">{notif.message}</p>
                            <p className="text-[8px] text-[#c06c84] mt-1">
                              {notif.createdAt?.toDate().toLocaleString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-[#f67280] rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                    {getUserNotifications().length === 0 && (
                      <div className="p-8 text-center text-[#6c5b7b]">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No tienes notificaciones</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-[#6c5b7b] hover:text-[#355c7d] transition-colors"
            >
              <ShoppingBag size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#355c7d] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <div className="w-9 h-9 rounded-full bg-[#f8b195]/20 border-2 border-[#f67280] overflow-hidden">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#c06c84]/20 overflow-hidden z-50">
                    <div className="p-4 bg-gradient-to-r from-[#f67280] to-[#c06c84] text-white">
                      <p className="font-bold truncate">{user.name}</p>
                      <p className="text-xs opacity-80 truncate">{user.email}</p>
                      {user.canPublish && (
                        <span className="text-[8px] bg-[#355c7d] px-2 py-0.5 rounded-full mt-1 inline-block">
                          Vendedor autorizado
                        </span>
                      )}
                      {user.isMainAdmin && (
                        <span className="text-[8px] bg-[#6c5b7b] px-2 py-0.5 rounded-full mt-1 inline-block ml-1">
                          Admin Principal
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setSelectedUserProfile(user.uid);
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8b195]/10 rounded-xl flex items-center gap-2 text-[#355c7d]"
                      >
                        <User size={16} /> Mi Perfil
                      </button>
                      <button
                        onClick={() => {
                          setIsEditProfileOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8b195]/10 rounded-xl flex items-center gap-2 text-[#355c7d]"
                      >
                        <Settings size={16} /> Editar Perfil
                      </button>
                      <button
                        onClick={() => {
                          setIsQuestionsOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8b195]/10 rounded-xl flex items-center gap-2 text-[#355c7d]"
                      >
                        <MessageSquare size={16} /> Preguntas ({getUserQuestions(user.uid).filter(q => !q.answer).length})
                      </button>
                      {user.isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setIsBuyersPanelOpen(true);
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8b195]/10 rounded-xl flex items-center gap-2 text-[#355c7d]"
                          >
                            <Users size={16} /> Compradores ({receipts.filter(r => !r.processed).length})
                          </button>
                          {user.isMainAdmin && (
                            <button
                              onClick={() => {
                                setIsAuthorizedUsersModalOpen(true);
                                setIsProfileOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8b195]/10 rounded-xl flex items-center gap-2 text-[#355c7d]"
                            >
                              <Lock size={16} /> Gestionar vendedores
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setShowAdminModal(true);
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8b195]/10 rounded-xl flex items-center gap-2 text-[#355c7d]"
                          >
                            <Settings size={16} /> Panel Admin
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 rounded-xl flex items-center gap-2"
                      >
                        <LogOut size={16} /> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="bg-[#f67280] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#355c7d] transition-all flex items-center gap-2"
              >
                <User size={14} />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* --- Filtros de Categorías (Pijamas, Pantuflas, Trajes de Baño, Accesorios) con imágenes --- */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6 justify-center overflow-x-auto no-scrollbar pb-6">
          {CATEGORY_FILTERS.map(cat => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id === selectedCategoryFilter ? null : cat.id)}
              className={"group flex-shrink-0 cursor-pointer flex flex-col items-center transition-all " +
                (selectedCategoryFilter === cat.id ? 'scale-105' : 'opacity-70 hover:opacity-100')}
            >
              <div className={"relative w-20 h-20 md:w-28 md:h-28 rounded-3xl overflow-hidden border-2 transition-all " +
                (selectedCategoryFilter === cat.id ? 'border-[#f67280] shadow-xl' : 'border-transparent shadow-sm')}>
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/5"></div>
              </div>
              <span className={"mt-3 text-[10px] font-black uppercase tracking-[0.2em] " +
                (selectedCategoryFilter === cat.id ? 'text-[#f67280]' : 'text-[#6c5b7b]')}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- Catálogo --- */}
      <main className="container mx-auto px-4 lg:px-8 mb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-serif font-light text-[#355c7d]">Explorar Piezas</h2>
            <p className="text-[10px] font-bold text-[#6c5b7b] uppercase tracking-widest">Colección curada: {filteredProducts.length} items</p>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-8">
            {filteredProducts.map(product => {
              const { original, discounted, hasDiscount } = getDiscountedPrice(product);
              return (
                <div
                  key={product.id}
                  className="group flex flex-col h-full bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-[#c06c84]/20 cursor-pointer"
                  onClick={() => openProductModal(product)}
                >
                  <div className="p-2 md:p-4 flex items-center justify-between bg-white z-10">
                    <div
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserProfile(product.userId);
                      }}
                    >
                      <img src={product.user.avatar} className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-[#f8b195]/20" alt="" />
                      <span className="text-[7px] md:text-[10px] font-bold text-[#355c7d] truncate max-w-[40px] md:max-w-none">{product.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] md:text-[10px] text-[#6c5b7b] flex items-center gap-1">
                        <ThumbsUp size={10} /> {product.likes}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(product.id);
                        }}
                        className="p-0.5"
                      >
                        {favorites.includes(product.id) ? (
                          <img src="/hoja.png" alt="Like" className="w-14 h-14 md:w-16 md:h-16 object-contain" />
                        ) : (
                          <Heart size={14} className="text-[#c06c84]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="relative aspect-[4/5] overflow-hidden bg-[#f8b195]/20">
                    <img
                      src={product.images ? product.images[0] : product.image}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={product.title}
                    />
                    {product.sold && (
                      <div className="absolute inset-0 bg-[#355c7d]/60 flex items-center justify-center">
                        <span className="bg-[#f67280] text-white px-4 py-2 rounded-full font-bold text-sm uppercase tracking-widest transform -rotate-12">
                          Vendido
                        </span>
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3">
                      <span className="bg-white/90 backdrop-blur-sm text-[#355c7d] text-[6px] md:text-[9px] font-black px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-full shadow-lg uppercase border border-[#c06c84]/20">
                        Talle {product.size}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 md:p-5 flex-1 flex flex-col">
                    <div className="mb-2 md:mb-4">
                      <div className="hidden md:flex items-center gap-1.5 mb-2">
                        <Tag size={10} className="text-[#f67280]" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#f67280]">{product.condition}</span>
                      </div>
                      <h3 className="text-[9px] md:text-sm font-medium text-[#355c7d] line-clamp-1 font-serif">{product.title}</h3>
                      {product.cuotas && (
                        <p className="text-[8px] md:text-[10px] text-[#6c5b7b] font-bold mt-1">{product.cuotas}</p>
                      )}
                    </div>

                    <div className="mt-auto flex flex-col border-t border-[#c06c84]/20 pt-2 md:pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[7px] md:text-[9px] font-bold text-[#6c5b7b] uppercase tracking-tighter">Precio</span>
                          {hasDiscount ? (
                            <div className="flex flex-col">
                              <span className="text-[8px] md:text-xs text-[#6c5b7b] line-through">${original.toLocaleString()}</span>
                              <span className="text-xs md:text-xl font-black text-green-600">${discounted.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-xs md:text-xl font-black text-[#355c7d]">${original.toLocaleString()}</span>
                          )}
                        </div>

                        {!product.sold && product.userId !== user?.uid && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#355c7d] border-b md:border-b-2 border-[#355c7d] pb-0.5 md:pb-1 hover:text-[#f67280] hover:border-[#f67280] transition-all"
                          >
                            Comprar
                          </button>
                        )}

                        {product.sold && (
                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#f67280] flex items-center gap-1">
                            <Ban size={12} /> Vendido
                          </span>
                        )}

                        {product.userId === user?.uid && !product.sold && (
                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-[#6c5b7b]">
                            Tu producto
                          </span>
                        )}
                      </div>

                      {user && product.userId === user.uid && (
                        <div className="mt-2 text-[8px] md:text-[10px] text-[#6c5b7b]">
                          <span className="font-medium">Neto a cobrar: </span>
                          <span className="font-bold text-[#f67280]">${(discounted - discounted * COMISION).toLocaleString()}</span>
                          <span className="text-[6px] md:text-[8px] ml-1">(19% comisión)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-[#c06c84]">
            <Search size={64} className="mb-4 opacity-10" />
            <h3 className="text-xl font-serif italic">Sin resultados</h3>
            <p className="text-sm mt-2">Intentá con otros filtros de búsqueda.</p>
          </div>
        )}
      </main>

      {/* --- Modal de Recorte de Imagen --- */}
      {isCropModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/80 backdrop-blur-sm" onClick={() => setIsCropModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#355c7d]">Recortar imagen</h3>
              <button onClick={() => setIsCropModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="relative h-96 mb-4">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'cover' ? 16/9 : 1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-bold text-[#355c7d]">Zoom:</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsCropModalOpen(false)}
                className="flex-1 bg-[#c06c84]/20 text-[#6c5b7b] py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 bg-[#f67280] text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#355c7d] transition-all"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Producto (con descuento) --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/80 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-[#c06c84]/20 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#355c7d]">Detalle del Producto</h2>
              <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-[#f8b195]/20">
                    <img
                      src={selectedProduct.images ? selectedProduct.images[currentImageIndex] : selectedProduct.image}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                    {selectedProduct.sold && (
                      <div className="absolute inset-0 bg-[#355c7d]/60 flex items-center justify-center">
                        <span className="bg-[#f67280] text-white px-6 py-3 rounded-full font-bold text-xl uppercase tracking-widest transform -rotate-12">
                          Vendido
                        </span>
                      </div>
                    )}
                  </div>
                  {(selectedProduct.images?.length > 1 || (!selectedProduct.images && selectedProduct.image)) && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-all text-[#355c7d]"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-all text-[#355c7d]"
                      >
                        <ChevronRightIcon size={24} />
                      </button>
                    </>
                  )}
                  {(selectedProduct.images?.length > 1 || (!selectedProduct.images && selectedProduct.image)) && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                      {(selectedProduct.images || [selectedProduct.image]).map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={"flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all " +
                            (currentImageIndex === idx ? 'border-[#f67280] scale-105' : 'border-transparent opacity-60 hover:opacity-100')}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={selectedProduct.user.avatar}
                      alt={selectedProduct.user.name}
                      className="w-12 h-12 rounded-full cursor-pointer border-2 border-[#f67280]"
                      onClick={() => {
                        setSelectedUserProfile(selectedProduct.userId);
                        setSelectedProduct(null);
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-lg text-[#355c7d]">{selectedProduct.user.name}</h3>
                      <p className="text-sm text-[#6c5b7b]">{getFollowersCount(selectedProduct.userId)} seguidores</p>
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold mb-2 text-[#355c7d]">{selectedProduct.title}</h2>
                  <p className="text-[#6c5b7b] mb-4">{selectedProduct.description || "Sin descripción"}</p>

                  <div className="flex items-center gap-4 mb-4">
                    {(() => {
                      const { original, discounted, hasDiscount } = getDiscountedPrice(selectedProduct);
                      return hasDiscount ? (
                        <div className="flex flex-col">
                          <span className="text-2xl text-[#6c5b7b] line-through">${original.toLocaleString()}</span>
                          <span className="text-3xl font-black text-green-600">${discounted.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-black text-[#f67280]">${original.toLocaleString()}</span>
                      );
                    })()}
                    {selectedProduct.cuotas && (
                      <span className="bg-[#f8b195]/30 text-[#355c7d] px-3 py-1 rounded-full text-sm font-bold">
                        {selectedProduct.cuotas}
                      </span>
                    )}
                  </div>

                  {user && selectedProduct.userId === user.uid && (
                    <div className="mb-4 text-sm bg-[#f8b195]/20 p-4 rounded-xl">
                      <p className="font-bold mb-2 text-[#355c7d]">Detalle de la venta:</p>
                      <div className="space-y-1">
                        <p className="flex justify-between text-[#355c7d]">
                          <span>Precio de venta:</span>
                          <span className="font-bold">${getDiscountedPrice(selectedProduct).discounted.toLocaleString()}</span>
                        </p>
                        <p className="flex justify-between text-[#f67280]">
                          <span>Comisión Pijamas (19%):</span>
                          <span className="font-bold">-${(getDiscountedPrice(selectedProduct).discounted * COMISION).toLocaleString()}</span>
                        </p>
                        <p className="flex justify-between text-[#355c7d] border-t border-[#c06c84]/20 pt-1 mt-1">
                          <span className="font-bold">Neto a cobrar:</span>
                          <span className="font-bold">${(getDiscountedPrice(selectedProduct).discounted - getDiscountedPrice(selectedProduct).discounted * COMISION).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#f8b195]/20 p-3 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-[#6c5b7b]">Condición</span>
                      <p className="font-bold text-[#355c7d]">{selectedProduct.condition}</p>
                    </div>
                    <div className="bg-[#f8b195]/20 p-3 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-[#6c5b7b]">Talle</span>
                      <p className="font-bold text-[#355c7d]">{selectedProduct.size}</p>
                    </div>
                    <div className="bg-[#f8b195]/20 p-3 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-[#6c5b7b]">Categoría</span>
                      <p className="font-bold text-[#355c7d]">{CATEGORIES.find(c => c.id === selectedProduct.category)?.name}</p>
                    </div>
                    <div className="bg-[#f8b195]/20 p-3 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-[#6c5b7b]">Género</span>
                      <p className="font-bold text-[#355c7d]">Mujer</p>
                    </div>
                  </div>

                  {(selectedProduct.shoulderToShoulder || selectedProduct.armpitToArmpit || selectedProduct.length || selectedProduct.waist || selectedProduct.hip || selectedProduct.inseam || selectedProduct.outseam) && (
                    <div className="mb-6">
                      <h4 className="font-bold text-sm text-[#355c7d] mb-3">Medidas (cm)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedProduct.shoulderToShoulder && (
                          <div className="bg-[#f8b195]/20 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Hombro a hombro</span>
                            <p className="font-bold text-sm text-[#355c7d]">{selectedProduct.shoulderToShoulder} cm</p>
                          </div>
                        )}
                        {selectedProduct.armpitToArmpit && (
                          <div className="bg-[#f8b195]/20 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Axila a axila</span>
                            <p className="font-bold text-sm text-[#355c7d]">{selectedProduct.armpitToArmpit} cm</p>
                          </div>
                        )}
                        {selectedProduct.length && (
                          <div className="bg-[#f8b195]/20 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Largo</span>
                            <p className="font-bold text-sm text-[#355c7d]">{selectedProduct.length} cm</p>
                          </div>
                        )}
                        {selectedProduct.waist && (
                          <div className="bg-[#f8b195]/20 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Cintura</span>
                            <p className="font-bold text-sm text-[#355c7d]">{selectedProduct.waist} cm</p>
                          </div>
                        )}
                        {selectedProduct.hip && (
                          <div className="bg-[#f8b195]/20 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Cadera</span>
                            <p className="font-bold text-sm text-[#355c7d]">{selectedProduct.hip} cm</p>
                          </div>
                        )}
                        {selectedProduct.inseam && (
                          <div className="bg-[#f8b195]/20 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Tiro</span>
                            <p className="font-bold text-sm text-[#355c7d]">{selectedProduct.inseam} cm</p>
                          </div>
                        )}
                        {selectedProduct.outseam && (
                          <div className="bg-[#f8b195]/20 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Largo total</span>
                            <p className="font-bold text-sm text-[#355c7d]">{selectedProduct.outseam} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <ThumbsUp size={20} className="text-[#f67280]" />
                      <span className="font-bold text-lg text-[#355c7d]">{selectedProduct.likes}</span>
                      <span className="text-[#6c5b7b]">me gusta</span>
                    </div>
                  </div>

                  {!selectedProduct.sold && selectedProduct.userId !== user?.uid && (
                    <button
                      onClick={() => addToCart(selectedProduct)}
                      className="w-full bg-[#f67280] text-white py-4 rounded-2xl font-bold uppercase text-sm tracking-widest hover:bg-[#355c7d] transition-all flex items-center justify-center gap-2 mb-6"
                    >
                      <ShoppingBag size={18} /> Agregar al carrito
                    </button>
                  )}

                  {selectedProduct.sold && (
                    <div className="w-full bg-[#f67280] text-white py-4 rounded-2xl font-bold uppercase text-sm tracking-widest flex items-center justify-center gap-2 mb-6">
                      <Ban size={18} /> Producto Vendido
                    </div>
                  )}

                  {selectedProduct.userId === user?.uid && !selectedProduct.sold && (
                    <div className="w-full bg-[#c06c84]/20 text-[#6c5b7b] py-4 rounded-2xl font-bold uppercase text-sm tracking-widest flex items-center justify-center gap-2 mb-6">
                      <Info size={18} /> Este es tu producto
                    </div>
                  )}

                  <div className="mb-6">
                    <h4 className="font-bold text-lg text-[#355c7d] mb-4">Preguntas sobre el producto</h4>

                    {user && !selectedProduct.sold && selectedProduct.userId !== user.uid && (
                      <div className="mb-4">
                        <textarea
                          placeholder="Haz tu pregunta..."
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-xl p-3 text-sm h-20 text-[#355c7d] focus:ring-1 focus:ring-[#f67280] outline-none"
                        />
                        <button
                          onClick={() => handleAskQuestion(selectedProduct.id)}
                          className="mt-2 bg-[#f67280] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-[#355c7d] transition-all"
                        >
                          Preguntar
                        </button>
                      </div>
                    )}

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {getProductQuestions(selectedProduct.id).map((q) => (
                        <div key={q.id} className="bg-[#f8b195]/10 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={q.userAvatar} alt={q.userName} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-bold text-[#355c7d]">{q.userName}</span>
                            <span className="text-[8px] text-[#6c5b7b]">
                              {q.createdAt?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2 text-[#355c7d]">❓ {q.question}</p>
                          {q.answer ? (
                            <div className="bg-white p-3 rounded-lg ml-4">
                              <p className="text-sm text-[#f67280]">✅ Respuesta: {q.answer}</p>
                              <p className="text-[8px] text-[#6c5b7b] mt-1">
                                Respondido el {q.answeredAt?.toDate().toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            user && selectedProduct.userId === user.uid && (
                              <div className="mt-2">
                                {selectedQuestion === q.id ? (
                                  <div>
                                    <textarea
                                      placeholder="Escribe tu respuesta..."
                                      value={newAnswer}
                                      onChange={(e) => setNewAnswer(e.target.value)}
                                      className="w-full bg-white border border-[#c06c84]/20 rounded-xl p-2 text-sm h-16 text-[#355c7d] focus:ring-1 focus:ring-[#f67280] outline-none"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleAnswerQuestion(q.id)}
                                        className="bg-[#f67280] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-[#355c7d] transition-all"
                                      >
                                        Responder
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedQuestion(null);
                                          setNewAnswer("");
                                        }}
                                        className="bg-[#c06c84]/20 text-[#6c5b7b] px-3 py-1 rounded-lg text-xs font-bold"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedQuestion(q.id)}
                                    className="text-[#f67280] text-xs font-bold"
                                  >
                                    Responder
                                  </button>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ))}
                      {getProductQuestions(selectedProduct.id).length === 0 && (
                        <p className="text-center text-[#6c5b7b] py-4">No hay preguntas aún</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Perfil de Usuario --- */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/60 backdrop-blur-sm" onClick={() => setSelectedUserProfile(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-[#c06c84]/20 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#355c7d]">Perfil de {users[selectedUserProfile]?.name}</h2>
              <button onClick={() => setSelectedUserProfile(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-16">
                <div className="h-48 rounded-2xl overflow-hidden">
                  <img
                    src={users[selectedUserProfile]?.coverImage || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=1200"}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-12 left-6">
                  <div className="w-24 h-24 rounded-full border-4 border-[#f67280] overflow-hidden bg-white">
                    <img
                      src={users[selectedUserProfile]?.avatar}
                      alt={users[selectedUserProfile]?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-bold text-[#355c7d]">{users[selectedUserProfile]?.name}</h3>
                <p className="text-[#6c5b7b] mt-1">{users[selectedUserProfile]?.bio || "Sin biografía"}</p>
                {users[selectedUserProfile]?.canPublish && (
                  <span className="inline-block mt-2 bg-[#f8b195]/30 text-[#355c7d] text-[10px] font-bold px-3 py-1 rounded-full">
                    Vendedor autorizado
                  </span>
                )}
                
                {user && user.uid === selectedUserProfile && (
                  <div className="mt-4 bg-[#f8b195]/20 p-4 rounded-2xl">
                    <p className="text-sm text-[#355c7d] mb-1 flex items-center gap-2">
                      <DollarSign size={16} />
                      <span className="font-bold">Total ganado (neto):</span>
                    </p>
                    <p className="text-2xl font-black text-[#f67280]">
                      {"$" + (users[selectedUserProfile]?.totalEarned || 0).toLocaleString()}
                    </p>
                    <p className="text-[8px] text-[#6c5b7b] mt-1">
                      *Después de comisión del 19%
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  {user && user.uid !== selectedUserProfile && (
                    <button
                      onClick={() => handleFollow(selectedUserProfile)}
                      className={"px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all " +
                        (isFollowing(selectedUserProfile) ? 'bg-[#c06c84]/20 text-[#6c5b7b] hover:bg-[#c06c84]/30' : 'bg-[#f67280] text-white hover:bg-[#355c7d]')}
                    >
                      {isFollowing(selectedUserProfile) ? (
                        <>
                          <UserCheck size={14} /> Siguiendo
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} /> Seguir
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-8 border-b border-[#c06c84]/20 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedTab('publicaciones')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'publicaciones' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b] hover:text-[#355c7d]')}
                >
                  Publicaciones ({getUserProducts(selectedUserProfile).filter(p => !p.sold && p.status.publicada).length})
                </button>
                <button
                  onClick={() => setSelectedTab('pendientes')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'pendientes' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b] hover:text-[#355c7d]')}
                >
                  Pendientes ({getUserProducts(selectedUserProfile).filter(p => !p.status.publicada).length})
                </button>
                <button
                  onClick={() => setSelectedTab('vendidos')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'vendidos' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b] hover:text-[#355c7d]')}
                >
                  Vendidos ({getUserProducts(selectedUserProfile).filter(p => p.sold).length})
                </button>
                <button
                  onClick={() => setSelectedTab('preguntas')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'preguntas' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b] hover:text-[#355c7d]')}
                >
                  Preguntas ({getUserQuestions(selectedUserProfile).filter(q => !q.answer).length})
                </button>
                <button
                  onClick={() => setSelectedTab('seguidores')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'seguidores' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b] hover:text-[#355c7d]')}
                >
                  Seguidores ({getFollowersCount(selectedUserProfile)})
                </button>
                <button
                  onClick={() => setSelectedTab('siguiendo')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'siguiendo' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b] hover:text-[#355c7d]')}
                >
                  Siguiendo ({getFollowingCount(selectedUserProfile)})
                </button>
                <button
                  onClick={() => setSelectedTab('likes')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'likes' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b] hover:text-[#355c7d]')}
                >
                  Likes recibidos ({getLikesReceived(selectedUserProfile)})
                </button>
              </div>

              <div className="mt-6">
                {selectedTab === 'publicaciones' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getUserProducts(selectedUserProfile).filter(p => !p.sold && p.status.publicada).map(product => (
                      <div
                        key={product.id}
                        className="border border-[#c06c84]/20 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all"
                        onClick={() => {
                          openProductModal(product);
                          setSelectedUserProfile(null);
                        }}
                      >
                        <img
                          src={product.images ? product.images[0] : product.image}
                          alt={product.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <p className="font-bold text-sm text-[#355c7d] truncate">{product.title}</p>
                          <p className="text-[10px] text-[#6c5b7b] mt-1">${getDiscountedPrice(product).discounted.toLocaleString()}</p>
                          <div className="mt-2 flex items-center gap-1 text-[8px]">
                            <div className={"w-1.5 h-1.5 rounded-full " + (product.status.iniciada ? 'bg-[#f67280]' : 'bg-[#c06c84]/30')}></div>
                            <div className={"w-1.5 h-1.5 rounded-full " + (product.status.verificada ? 'bg-[#f67280]' : 'bg-[#c06c84]/30')}></div>
                            <div className={"w-1.5 h-1.5 rounded-full " + (product.status.aprobada ? 'bg-[#f67280]' : 'bg-[#c06c84]/30')}></div>
                            <div className={"w-1.5 h-1.5 rounded-full " + (product.status.publicada ? 'bg-[#f67280]' : 'bg-[#c06c84]/30')}></div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[8px] text-[#6c5b7b] flex items-center gap-1">
                              <ThumbsUp size={8} /> {product.likes}
                            </span>
                            {user?.uid === selectedUserProfile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProduct(product);
                                }}
                                className="text-[8px] text-[#f67280] hover:text-[#355c7d]"
                              >
                                Editar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'pendientes' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getUserProducts(selectedUserProfile).filter(p => !p.status.publicada).map(product => (
                      <div
                        key={product.id}
                        className="border border-[#c06c84]/20 rounded-xl overflow-hidden cursor-pointer opacity-75"
                        onClick={() => {
                          openProductModal(product);
                          setSelectedUserProfile(null);
                        }}
                      >
                        <img
                          src={product.images ? product.images[0] : product.image}
                          alt={product.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <p className="font-bold text-sm text-[#355c7d] truncate">{product.title}</p>
                          <p className="text-[10px] text-[#6c5b7b] mt-1">${product.price.toLocaleString()}</p>
                          <p className="text-[8px] text-[#f67280] mt-1">En revisión</p>
                          {user?.uid === selectedUserProfile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProduct(product);
                              }}
                              className="mt-2 text-[8px] text-[#f67280] hover:text-[#355c7d]"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'vendidos' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getUserProducts(selectedUserProfile).filter(p => p.sold).map(product => (
                      <div key={product.id} className="border border-[#c06c84]/20 rounded-xl overflow-hidden opacity-75">
                        <div className="relative">
                          <img
                            src={product.images ? product.images[0] : product.image}
                            alt={product.title}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-[#355c7d]/50 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">VENDIDO</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-sm text-[#355c7d] truncate">{product.title}</p>
                          <p className="text-[10px] text-[#6c5b7b] mt-1">${product.price.toLocaleString()}</p>
                          <p className="text-[8px] text-[#6c5b7b] mt-1">Vendido</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'preguntas' && (
                  <div className="space-y-4">
                    {getUserQuestions(selectedUserProfile).map((q) => {
                      const product = [...products, ...pendingProducts].find(p => p.id === q.productId);
                      return (
                        <div key={q.id} className="bg-[#f8b195]/10 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={q.userAvatar} alt={q.userName} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-bold text-[#355c7d]">{q.userName}</span>
                            <span className="text-[8px] text-[#6c5b7b]">
                              {q.createdAt?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2 text-[#355c7d]">❓ {q.question}</p>
                          {product && (
                            <div className="text-xs text-[#6c5b7b] mb-2">
                              Sobre: {product.title}
                            </div>
                          )}
                          {q.answer ? (
                            <div className="bg-white p-3 rounded-lg ml-4">
                              <p className="text-sm text-[#f67280]">✅ Respuesta: {q.answer}</p>
                              <p className="text-[8px] text-[#6c5b7b] mt-1">
                                Respondido el {q.answeredAt?.toDate().toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            user && selectedUserProfile === user.uid && (
                              <div className="mt-2">
                                {selectedQuestion === q.id ? (
                                  <div>
                                    <textarea
                                      placeholder="Escribe tu respuesta..."
                                      value={newAnswer}
                                      onChange={(e) => setNewAnswer(e.target.value)}
                                      className="w-full bg-white border border-[#c06c84]/20 rounded-xl p-2 text-sm h-16 text-[#355c7d] focus:ring-1 focus:ring-[#f67280] outline-none"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleAnswerQuestion(q.id)}
                                        className="bg-[#f67280] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-[#355c7d] transition-all"
                                      >
                                        Responder
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedQuestion(null);
                                          setNewAnswer("");
                                        }}
                                        className="bg-[#c06c84]/20 text-[#6c5b7b] px-3 py-1 rounded-lg text-xs font-bold"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedQuestion(q.id)}
                                    className="text-[#f67280] text-xs font-bold"
                                  >
                                    Responder
                                  </button>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                    {getUserQuestions(selectedUserProfile).length === 0 && (
                      <p className="text-center text-[#6c5b7b] py-8">No hay preguntas aún</p>
                    )}
                  </div>
                )}

                {selectedTab === 'seguidores' && (
                  <div className="space-y-2">
                    {followers[selectedUserProfile]?.map(followerId => {
                      const follower = users[followerId];
                      return follower ? (
                        <div
                          key={followerId}
                          className="flex items-center gap-3 p-3 bg-[#f8b195]/10 rounded-xl cursor-pointer hover:bg-[#f8b195]/20 transition-all"
                          onClick={() => setSelectedUserProfile(followerId)}
                        >
                          <img src={follower.avatar} alt={follower.name} className="w-10 h-10 rounded-full border border-[#f67280]" />
                          <div>
                            <p className="font-bold text-[#355c7d]">{follower.name}</p>
                            <p className="text-xs text-[#6c5b7b]">{follower.email}</p>
                          </div>
                        </div>
                      ) : null;
                    })}
                    {(!followers[selectedUserProfile] || followers[selectedUserProfile].length === 0) && (
                      <p className="text-center text-[#6c5b7b] py-8">No tiene seguidores aún</p>
                    )}
                  </div>
                )}

                {selectedTab === 'siguiendo' && (
                  <div className="space-y-2">
                    {following[selectedUserProfile]?.map(followingId => {
                      const followingUser = users[followingId];
                      return followingUser ? (
                        <div
                          key={followingId}
                          className="flex items-center gap-3 p-3 bg-[#f8b195]/10 rounded-xl cursor-pointer hover:bg-[#f8b195]/20 transition-all"
                          onClick={() => setSelectedUserProfile(followingId)}
                        >
                          <img src={followingUser.avatar} alt={followingUser.name} className="w-10 h-10 rounded-full border border-[#f67280]" />
                          <div>
                            <p className="font-bold text-[#355c7d]">{followingUser.name}</p>
                            <p className="text-xs text-[#6c5b7b]">{followingUser.email}</p>
                          </div>
                        </div>
                      ) : null;
                    })}
                    {(!following[selectedUserProfile] || following[selectedUserProfile].length === 0) && (
                      <p className="text-center text-[#6c5b7b] py-8">No sigue a nadie aún</p>
                    )}
                  </div>
                )}

                {selectedTab === 'likes' && (
                  <div className="space-y-2">
                    {products
                      .filter(p => p.userId === selectedUserProfile && p.likedBy && p.likedBy.length > 0)
                      .map(product => (
                        <div key={product.id} className="p-4 bg-[#f8b195]/10 rounded-xl">
                          <p className="font-bold mb-2 text-[#355c7d]">{product.title} - {product.likes} likes</p>
                          <div className="flex flex-wrap gap-2">
                            {product.likedBy?.map(likerId => {
                              const liker = users[likerId];
                              return liker ? (
                                <div
                                  key={likerId}
                                  className="flex items-center gap-2 bg-white p-2 rounded-lg cursor-pointer hover:shadow-md transition-all"
                                  onClick={() => setSelectedUserProfile(likerId)}
                                >
                                  <img src={liker.avatar} alt={liker.name} className="w-6 h-6 rounded-full" />
                                  <span className="text-xs text-[#355c7d]">{liker.name}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      ))}
                    {products.filter(p => p.userId === selectedUserProfile && p.likedBy && p.likedBy.length > 0).length === 0 && (
                      <p className="text-center text-[#6c5b7b] py-8">Aún no ha recibido likes</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Gestión de Usuarios Autorizados --- */}
      {isAuthorizedUsersModalOpen && user?.isMainAdmin && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/80 backdrop-blur-sm" onClick={() => setIsAuthorizedUsersModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-[#355c7d]">
                <Lock size={24} className="text-[#f67280]" />
                Gestionar Vendedores Autorizados
              </h2>
              <button onClick={() => setIsAuthorizedUsersModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-[#6c5b7b] mb-4">
                Estos usuarios pueden publicar productos en la plataforma.
              </p>
              
              <div className="flex gap-2 mb-6">
                <input
                  type="email"
                  placeholder="Email del nuevo vendedor"
                  value={newAuthorizedEmail}
                  onChange={(e) => setNewAuthorizedEmail(e.target.value)}
                  className="flex-1 bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                />
                <button
                  onClick={handleAddAuthorizedUser}
                  className="bg-[#f67280] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#355c7d] transition-all"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm text-[#355c7d] mb-3">Vendedores actuales:</h3>
                {authorizedSellers.map(email => (
                  <div key={email} className="flex items-center justify-between p-4 bg-[#f8b195]/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#f8b195]/30 rounded-full flex items-center justify-center">
                        <Check size={16} className="text-[#f67280]" />
                      </div>
                      <span className="font-medium text-[#355c7d]">{email}</span>
                      {MAIN_ADMINS.includes(email) && (
                        <span className="text-[8px] bg-[#c06c84]/30 text-[#6c5b7b] px-2 py-0.5 rounded-full">
                          Admin Principal
                        </span>
                      )}
                    </div>
                    {!MAIN_ADMINS.includes(email) && (
                      <button
                        onClick={() => handleRemoveAuthorizedUser(email)}
                        className="text-[#f67280] hover:text-[#355c7d] p-2 hover:bg-[#f8b195]/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsAuthorizedUsersModalOpen(false)}
              className="w-full bg-[#c06c84]/20 text-[#6c5b7b] py-4 rounded-xl font-bold text-sm hover:bg-[#c06c84]/30 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* --- Modal de Edición de Perfil --- */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/60 backdrop-blur-sm" onClick={() => setIsEditProfileOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#355c7d]">Editar Perfil</h3>
              <button onClick={() => setIsEditProfileOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#6c5b7b] mb-2">Nombre</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-xl p-3 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#6c5b7b] mb-2">Biografía</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-xl p-3 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d] h-24"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#6c5b7b] mb-2">WhatsApp (para notificaciones)</label>
                <input
                  type="tel"
                  placeholder="Ej: 5491124689196"
                  value={profileData.whatsappNumber}
                  onChange={(e) => setProfileData({...profileData, whatsappNumber: e.target.value})}
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-xl p-3 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                />
                <p className="text-[8px] text-[#6c5b7b] mt-1">Recibirás notificaciones cuando vendas un producto</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#6c5b7b] mb-2">Foto de perfil</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#f8b195]/20 overflow-hidden">
                    <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <label className="bg-[#f67280] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase cursor-pointer hover:bg-[#355c7d] transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'avatar')}
                      className="hidden"
                    />
                    Subir foto
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#6c5b7b] mb-2">Foto de portada</label>
                <div className="space-y-2">
                  <div className="h-24 rounded-xl bg-[#f8b195]/20 overflow-hidden">
                    <img src={profileData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                  <label className="inline-block bg-[#f67280] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase cursor-pointer hover:bg-[#355c7d] transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'cover')}
                      className="hidden"
                    />
                    Subir portada
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#f67280] text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#355c7d] transition-all mt-4"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal de Preguntas para el Vendedor --- */}
      {isQuestionsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/60 backdrop-blur-sm" onClick={() => setIsQuestionsOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#355c7d]">Preguntas recibidas</h3>
              <button onClick={() => setIsQuestionsOpen(false)}><X size={24} /></button>
            </div>
            <div className="space-y-4">
              {getUserQuestions(user?.uid).map((q) => {
                const product = [...products, ...pendingProducts].find(p => p.id === q.productId);
                return (
                  <div key={q.id} className="bg-[#f8b195]/10 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={q.userAvatar} alt={q.userName} className="w-6 h-6 rounded-full" />
                      <span className="text-xs font-bold text-[#355c7d]">{q.userName}</span>
                      <span className="text-[8px] text-[#6c5b7b]">
                        {q.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2 text-[#355c7d]">❓ {q.question}</p>
                    {product && (
                      <div className="text-xs text-[#6c5b7b] mb-2">
                        Sobre: <span className="font-bold">{product.title}</span>
                      </div>
                    )}
                    {q.answer ? (
                      <div className="bg-white p-3 rounded-lg ml-4">
                        <p className="text-sm text-[#f67280]">✅ Respuesta: {q.answer}</p>
                        <p className="text-[8px] text-[#6c5b7b] mt-1">
                          Respondido el {q.answeredAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        {selectedQuestion === q.id ? (
                          <div>
                            <textarea
                              placeholder="Escribe tu respuesta..."
                              value={newAnswer}
                              onChange={(e) => setNewAnswer(e.target.value)}
                              className="w-full bg-white border border-[#c06c84]/20 rounded-xl p-2 text-sm h-16 text-[#355c7d] focus:ring-1 focus:ring-[#f67280] outline-none"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleAnswerQuestion(q.id)}
                                className="bg-[#f67280] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-[#355c7d] transition-all"
                              >
                                Responder
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedQuestion(null);
                                  setNewAnswer("");
                                }}
                                className="bg-[#c06c84]/20 text-[#6c5b7b] px-3 py-1 rounded-lg text-xs font-bold"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedQuestion(q.id)}
                            className="text-[#f67280] text-xs font-bold"
                          >
                            Responder
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {getUserQuestions(user?.uid).length === 0 && (
                <p className="text-center text-[#6c5b7b] py-8">No tienes preguntas pendientes</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Modal PIN --- */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/60 backdrop-blur-sm" onClick={() => setShowPinModal(false)}></div>
          <div className="relative bg-white p-8 rounded-3xl w-full max-w-xs text-center shadow-2xl">
            <Lock className="mx-auto mb-4 text-[#f67280]" size={32} />
            <h3 className="font-bold mb-4 text-[#355c7d]">Acceso Editor</h3>
            <input
              type="password"
              placeholder="PIN"
              className="w-full bg-[#f8b195]/10 rounded-xl py-3 px-5 text-center text-xl tracking-widest mb-4 outline-none border border-[#c06c84]/20 focus:border-[#f67280] text-[#355c7d]"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            <button
              onClick={handlePinSubmit}
              className="w-full bg-[#f67280] text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#355c7d] transition-all"
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {/* --- Modal Admin SALE! y Gestión de Publicaciones (con sección de descuentos) --- */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/80 backdrop-blur-sm" onClick={() => setShowAdminModal(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold italic flex items-center gap-2 tracking-tighter text-[#355c7d]"><Edit3 /> Panel de Administración</h2>
              <button onClick={() => setShowAdminModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>

            <div className="mb-8">
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setIsModalOpen(true);
                }}
                className="w-full bg-[#f67280] text-white py-4 rounded-2xl font-bold uppercase text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-[#355c7d] transition-all"
              >
                <PlusCircle size={20} /> Nueva Publicación
              </button>
            </div>

            {/* Sección de Descuentos Global y por Categoría */}
            <div className="mb-12 p-6 bg-[#f8b195]/10 rounded-3xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#355c7d]"><Tag size={18} /> Configurar Descuentos</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#6c5b7b]">Descuento Global (%)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 bg-white border border-[#c06c84]/20 p-4 rounded-2xl outline-none focus:border-[#f67280] text-[#355c7d]"
                      value={saleConfig.promo}
                      onChange={(e) => setSaleConfig({...saleConfig, promo: e.target.value})}
                      placeholder="Ej: 50"
                    />
                    <button
                      onClick={() => setSaleConfig({...saleConfig, active: !saleConfig.active})}
                      className={`px-4 rounded-2xl font-bold text-sm ${saleConfig.active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}
                    >
                      {saleConfig.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                  <p className="text-[8px] text-[#6c5b7b]">El banner debe estar activo para que el descuento se aplique.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#6c5b7b]">Fecha de finalización</label>
                  <input
                    type="date"
                    className="w-full bg-white border border-[#c06c84]/20 p-4 rounded-2xl outline-none focus:border-[#f67280] text-[#355c7d]"
                    value={saleConfig.fechaFin || ''}
                    onChange={(e) => setSaleConfig({...saleConfig, fechaFin: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#6c5b7b]">Texto adicional (opcional)</label>
                  <textarea
                    rows="2"
                    className="w-full bg-white border border-[#c06c84]/20 p-4 rounded-2xl outline-none focus:border-[#f67280] text-[#355c7d]"
                    value={saleConfig.textoAdicional || ''}
                    onChange={(e) => setSaleConfig({...saleConfig, textoAdicional: e.target.value})}
                    placeholder="Ej: Oferta válida hasta agotar stock"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-[#6c5b7b]">Descuentos por Categoría (porcentaje)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CATEGORIES.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#c06c84]/20">
                        <span className="text-xs font-medium text-[#355c7d] capitalize">{cat.name}</span>
                        <input
                          type="number"
                          placeholder="%"
                          className="w-16 text-center bg-[#f8b195]/10 rounded-lg p-1 text-sm"
                          value={categoryDiscounts[cat.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCategoryDiscounts(prev => ({
                              ...prev,
                              [cat.id]: val === '' ? undefined : parseInt(val)
                            }));
                          }}
                        />
                        {categoryDiscounts[cat.id] && (
                          <button
                            onClick={() => {
                              const newDiscounts = {...categoryDiscounts};
                              delete newDiscounts[cat.id];
                              setCategoryDiscounts(newDiscounts);
                            }}
                            className="text-red-500 text-xs"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[8px] text-[#6c5b7b]">Los descuentos por categoría tienen prioridad sobre el descuento global.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-6 border-b border-[#c06c84]/20">
              <button
                onClick={() => setSelectedTab('pendientes')}
                className={"px-4 py-2 text-sm font-bold uppercase tracking-widest " +
                  (selectedTab === 'pendientes' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b]')}
              >
                Pendientes ({pendingProducts.length})
              </button>
              <button
                onClick={() => setSelectedTab('publicadas')}
                className={"px-4 py-2 text-sm font-bold uppercase tracking-widest " +
                  (selectedTab === 'publicadas' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b]')}
              >
                Publicadas ({products.length})
              </button>
              <button
                onClick={() => setSelectedTab('vendidas')}
                className={"px-4 py-2 text-sm font-bold uppercase tracking-widest " +
                  (selectedTab === 'vendidas' ? 'text-[#355c7d] border-b-2 border-[#355c7d]' : 'text-[#6c5b7b]')}
              >
                Vendidas ({[...products, ...pendingProducts].filter(p => p.sold).length})
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#355c7d]">
                <Clock size={18} /> {selectedTab === 'pendientes' ? 'Publicaciones Pendientes' : selectedTab === 'publicadas' ? 'Publicaciones Publicadas' : 'Publicaciones Vendidas'}
              </h3>
              <div className="space-y-6">
                {(selectedTab === 'pendientes' ? pendingProducts : selectedTab === 'publicadas' ? products : [...products, ...pendingProducts].filter(p => p.sold)).map(product => (
                  <div key={product.id} className="border border-[#c06c84]/20 rounded-3xl p-6 bg-gradient-to-r from-[#f8b195]/5 to-white shadow-lg hover:shadow-xl transition-all">
                    <div className="flex gap-6">
                      <div className="relative">
                        <img
                          src={product.images ? product.images[0] : product.image}
                          alt={product.title}
                          className="w-28 h-28 object-cover rounded-2xl shadow-md"
                        />
                        <button
                          onClick={() => downloadImage(product.images ? product.images[0] : product.image, product.title + ".jpg")}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg hover:bg-slate-100"
                          title="Descargar imagen"
                        >
                          <Download size={16} />
                        </button>
                        {product.sold && (
                          <div className="absolute inset-0 bg-[#355c7d]/50 rounded-2xl flex items-center justify-center">
                            <span className="text-white font-bold text-xs rotate-12">VENDIDO</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-xl text-[#355c7d] mb-1">{product.title}</h4>
                            <div className="flex items-center gap-2">
                              <img src={product.user.avatar} alt={product.user.name} className="w-5 h-5 rounded-full" />
                              <p className="text-sm text-[#6c5b7b]">{product.user.name}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {selectedTab === 'pendientes' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(product.id, 'verificada')}
                                  className={"p-3 rounded-xl transition-all transform hover:scale-105 " +
                                    (product.status.verificada ? 'bg-[#f8b195]/30 text-[#355c7d] shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-[#f8b195]/20 hover:text-[#355c7d]')}
                                  title="Verificar"
                                >
                                  <CheckCircle size={22} />
                                </button>
                                <button
                                  onClick={() => handleStatusChange(product.id, 'aprobada')}
                                  className={"p-3 rounded-xl transition-all transform hover:scale-105 " +
                                    (product.status.aprobada ? 'bg-[#f8b195]/30 text-[#355c7d] shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-[#f8b195]/20 hover:text-[#355c7d]')}
                                  title="Aprobar"
                                >
                                  <Check size={22} />
                                </button>
                                <button
                                  onClick={() => handlePublishProduct(product.id)}
                                  className="p-3 rounded-xl bg-[#f8b195]/30 text-[#355c7d] hover:bg-[#f8b195]/50 transition-all transform hover:scale-105"
                                  title="Publicar"
                                >
                                  <ArrowRight size={22} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-[#f8b195]/20 hover:text-[#355c7d] transition-all transform hover:scale-105"
                              title="Editar"
                            >
                              <Edit3 size={22} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all transform hover:scale-105"
                              title="Eliminar"
                            >
                              <Trash2 size={22} />
                            </button>
                          </div>
                        </div>

                        {!product.sold && (
                          <div className="mt-4 bg-[#f8b195]/10 p-4 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 flex-1">
                                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " +
                                  (product.status.iniciada ? 'bg-[#f67280] text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-[#c06c84]/30')}>
                                  {product.status.iniciada ? <Check size={16} /> : '1'}
                                </div>
                                <div className={"flex-1 h-1 " + (product.status.verificada ? 'bg-[#f67280]' : 'bg-[#c06c84]/30')}></div>
                                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " +
                                  (product.status.verificada ? 'bg-[#f67280] text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-[#c06c84]/30')}>
                                  {product.status.verificada ? <Check size={16} /> : '2'}
                                </div>
                                <div className={"flex-1 h-1 " + (product.status.aprobada ? 'bg-[#f67280]' : 'bg-[#c06c84]/30')}></div>
                                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " +
                                  (product.status.aprobada ? 'bg-[#f67280] text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-[#c06c84]/30')}>
                                  {product.status.aprobada ? <Check size={16} /> : '3'}
                                </div>
                                <div className={"flex-1 h-1 " + (product.status.publicada ? 'bg-[#f67280]' : 'bg-[#c06c84]/30')}></div>
                                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " +
                                  (product.status.publicada ? 'bg-[#f67280] text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-[#c06c84]/30')}>
                                  {product.status.publicada ? <Check size={16} /> : '4'}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between mt-2 px-1">
                              <span className="text-[10px] font-bold text-[#6c5b7b]">Iniciada</span>
                              <span className="text-[10px] font-bold text-[#6c5b7b]">Verificada</span>
                              <span className="text-[10px] font-bold text-[#6c5b7b]">Aprobada</span>
                              <span className="text-[10px] font-bold text-[#6c5b7b]">Publicada</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-[#f8b195]/10 p-2 rounded-xl">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Precio</span>
                            <p className="font-black text-sm text-[#355c7d]">${getDiscountedPrice(product).discounted.toLocaleString()}</p>
                          </div>
                          <div className="bg-[#f8b195]/10 p-2 rounded-xl">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Comisión</span>
                            <p className="font-bold text-sm text-[#f67280]">${(getDiscountedPrice(product).discounted * COMISION).toLocaleString()}</p>
                          </div>
                          <div className="bg-[#f8b195]/10 p-2 rounded-xl">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Neto vendedor</span>
                            <p className="font-bold text-sm text-[#355c7d]">${(getDiscountedPrice(product).discounted - getDiscountedPrice(product).discounted * COMISION).toLocaleString()}</p>
                          </div>
                          <div className="bg-[#f8b195]/10 p-2 rounded-xl">
                            <span className="text-[8px] font-bold uppercase text-[#6c5b7b]">Talle</span>
                            <p className="font-bold text-sm text-[#355c7d]">{product.size}</p>
                          </div>
                        </div>

                        {product.whatsappNumber && (
                          <div className="mt-3 bg-[#f8b195]/20 p-2 rounded-xl flex items-center gap-2">
                            <Phone size={14} className="text-[#f67280]" />
                            <span className="text-xs text-[#355c7d]">WhatsApp: {product.whatsappNumber}</span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => toggleSoldStatus(product.id, product.sold)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              product.sold 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-[#f8b195]/30 text-[#355c7d] hover:bg-[#f8b195]/50'
                            }`}
                          >
                            {product.sold ? (
                              <>
                                <ToggleRight size={14} /> Vendido
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={14} /> Marcar vendido
                              </>
                            )}
                          </button>
                          {product.sold && (
                            <button
                              onClick={() => toggleSoldStatus(product.id, product.sold)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f8b195]/30 text-[#355c7d] hover:bg-[#f8b195]/50 transition-all"
                            >
                              <RefreshCw size={14} /> Republicar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#355c7d]">
                <Users size={18} /> Usuarios Registrados
              </h3>
              
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar usuario por nombre o email..."
                    className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-4 px-12 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                    value={searchUserTerm}
                    onChange={(e) => setSearchUserTerm(e.target.value)}
                  />
                  <Search className="absolute left-4 top-4 text-[#6c5b7b]" size={20} />
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.values(users)
                  .filter(u => u.uid !== user?.uid)
                  .filter(u => 
                    u.name?.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchUserTerm.toLowerCase())
                  )
                  .map(userItem => {
                    return (
                      <div
                        key={userItem.uid}
                        className="flex items-center justify-between p-4 bg-[#f8b195]/10 rounded-2xl hover:bg-[#f8b195]/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={userItem.avatar}
                            alt={userItem.name}
                            className="w-12 h-12 rounded-full object-cover border border-[#f67280]"
                          />
                          <div>
                            <h4 className="font-bold text-[#355c7d]">{userItem.name}</h4>
                            <p className="text-xs text-[#6c5b7b]">{userItem.email}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Panel de Compradores (Admin) --- */}
      {isBuyersPanelOpen && user?.isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/80 backdrop-blur-sm" onClick={() => setIsBuyersPanelOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-[#355c7d]"><Users /> Compradores y Comprobantes</h2>
              <button onClick={() => setIsBuyersPanelOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>

            {selectedReceipt ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="flex items-center gap-2 text-sm text-[#6c5b7b] hover:text-[#355c7d]"
                >
                  <ChevronLeft size={18} /> Volver a la lista
                </button>
                
                <div className="bg-[#f8b195]/10 p-6 rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <img src={selectedReceipt.userAvatar} alt={selectedReceipt.userName} className="w-16 h-16 rounded-full border border-[#f67280]" />
                    <div>
                      <h3 className="text-xl font-bold text-[#355c7d]">{selectedReceipt.userName}</h3>
                      <p className="text-sm text-[#6c5b7b]">Comprado el {selectedReceipt.createdAt?.toDate().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold mb-2 text-[#355c7d]">Productos comprados:</h4>
                    <div className="space-y-2">
                      {selectedReceipt.cart?.map((item, index) => (
                        <div key={index} className="bg-white p-3 rounded-xl flex justify-between border border-[#c06c84]/20">
                          <span className="text-[#355c7d]">{item.title} (Talle: {item.size})</span>
                          <span className="font-bold text-[#f67280]">${item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-right">
                      <span className="text-lg font-bold text-[#355c7d]">Total: ${selectedReceipt.total?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold mb-2 text-[#355c7d]">Comprobante:</h4>
                    <div className="relative bg-white p-4 rounded-2xl overflow-auto max-h-96 border border-[#c06c84]/20">
                      <div className="sticky top-0 bg-white z-10 flex justify-end gap-2 p-2">
                        <button
                          onClick={() => setReceiptZoom(prev => Math.min(prev + 0.5, 3))}
                          className="p-2 bg-[#f8b195]/20 rounded-full hover:bg-[#f8b195]/40 transition-all"
                        >
                          <ZoomIn size={18} />
                        </button>
                        <button
                          onClick={() => setReceiptZoom(prev => Math.max(prev - 0.5, 0.5))}
                          className="p-2 bg-[#f8b195]/20 rounded-full hover:bg-[#f8b195]/40 transition-all"
                        >
                          <Maximize2 size={18} />
                        </button>
                        <button
                          onClick={() => downloadReceipt(selectedReceipt.receipt, selectedReceipt.receiptName)}
                          className="p-2 bg-[#f8b195]/20 rounded-full hover:bg-[#f8b195]/40 transition-all"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                      <img
                        src={selectedReceipt.receipt}
                        alt="Comprobante"
                        style={{ transform: `scale(${receiptZoom})`, transformOrigin: 'top left' }}
                        className="w-full transition-transform cursor-pointer"
                        onClick={() => setReceiptZoom(prev => prev === 1 ? 2 : 1)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        const receiptRef = doc(db, "receipts", selectedReceipt.id);
                        await updateDoc(receiptRef, { processed: true });
                        setSelectedReceipt(null);
                      }}
                      className="flex-1 bg-[#f67280] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#355c7d] transition-all"
                    >
                      Marcar como procesado
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {receipts.map(receipt => (
                  <div
                    key={receipt.id}
                    className={`border rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all ${!receipt.processed ? 'bg-[#f8b195]/20 border-[#f67280]' : 'border-[#c06c84]/20'}`}
                    onClick={() => setSelectedReceipt(receipt)}
                  >
                    <div className="flex items-center gap-4">
                      <img src={receipt.userAvatar} alt={receipt.userName} className="w-12 h-12 rounded-full border border-[#f67280]" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-[#355c7d]">{receipt.userName}</h3>
                            <p className="text-sm text-[#6c5b7b]">{receipt.cart?.length} productos</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#f67280]">${receipt.total?.toLocaleString()}</p>
                            <p className="text-[10px] text-[#6c5b7b]">{receipt.createdAt?.toDate().toLocaleString()}</p>
                          </div>
                        </div>
                        {!receipt.processed && (
                          <span className="mt-2 inline-block bg-[#f8b195]/30 text-[#355c7d] text-[8px] font-bold px-2 py-1 rounded-full">
                            Pendiente de procesar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {receipts.length === 0 && (
                  <div className="text-center py-16 text-[#6c5b7b]">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No hay comprobantes cargados aún</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Modal de Edición de Producto --- */}
      {isEditProductOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/70 backdrop-blur-md" onClick={() => setIsEditProductOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-bold tracking-tight text-[#355c7d]">Editar Publicación</h3>
                <button onClick={() => setIsEditProductOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleUpdateProduct} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6c5b7b] mb-2">Imágenes del producto (máx. 5)</label>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {(editingProduct.images || [editingProduct.image]).map((img, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-xl bg-[#f8b195]/10 overflow-hidden group">
                        <img src={img} alt={"Producto " + (index + 1)} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = (editingProduct.images || [editingProduct.image]).filter((_, i) => i !== index);
                            setEditingProduct({...editingProduct, images: newImages});
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(editingProduct.images?.length || 1) < 5 && (
                      <label className="w-24 h-24 rounded-xl bg-[#f8b195]/10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f8b195]/20 transition-colors">
                        <Camera size={24} className="text-[#6c5b7b]" />
                        <span className="text-[8px] text-[#6c5b7b] mt-1">Agregar</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files);
                            const newImages = [];
                            for (const file of files) {
                              if ((editingProduct.images?.length || 0) + newImages.length >= 5) break;
                              try {
                                const compressedImage = await compressImage(file, 1200, 0.7);
                                newImages.push(compressedImage);
                              } catch (error) {
                                console.error('Error comprimiendo imagen:', error);
                              }
                            }
                            setEditingProduct({
                              ...editingProduct,
                              images: [...(editingProduct.images || []), ...newImages]
                            });
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Título"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                  required
                />

                <textarea
                  placeholder="Descripción del producto"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d] h-24"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                />

                <input
                  type="number"
                  placeholder="Precio ($)"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                  required
                />

                <div className="bg-[#f8b195]/10 p-4 rounded-2xl">
                  <p className="text-sm text-[#6c5b7b] mb-2">
                    <span className="font-bold text-[#355c7d]">Comisión Pijamas (19%):</span> {"$" + (editingProduct.price * COMISION).toLocaleString()}
                  </p>
                  <p className="text-sm text-[#6c5b7b]">
                    <span className="font-bold text-[#355c7d]">Neto a cobrar:</span> {"$" + (editingProduct.price - editingProduct.price * COMISION).toLocaleString()}
                  </p>
                </div>

                <input
                  type="number"
                  placeholder="Cuotas sin interés (solo número, ej: 12)"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={editingProduct.cuotas ? editingProduct.cuotas.replace(/\D/g, '') : ''}
                  onChange={(e) => setEditingProduct({...editingProduct, cuotas: e.target.value})}
                />

                <input
                  type="tel"
                  placeholder="WhatsApp para notificaciones"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={editingProduct.whatsappNumber || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, whatsappNumber: e.target.value})}
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                    value={editingProduct.size}
                    onChange={(e) => setEditingProduct({...editingProduct, size: e.target.value})}
                  >
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                    value={editingProduct.category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      setEditingProduct({...editingProduct, category: newCategory});
                    }}
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {(editingProduct.category === 'pijamas' || editingProduct.category === 'trajes_baño') && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-[#355c7d]">Medidas (cm)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Hombro a hombro"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={editingProduct.shoulderToShoulder || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, shoulderToShoulder: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Axila a axila"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={editingProduct.armpitToArmpit || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, armpitToArmpit: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Largo"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={editingProduct.length || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, length: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Cintura"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={editingProduct.waist || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, waist: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Cadera"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={editingProduct.hip || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, hip: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                    value={editingProduct.condition}
                    onChange={(e) => setEditingProduct({...editingProduct, condition: e.target.value})}
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <select
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={editingProduct.ageGroup}
                  onChange={(e) => setEditingProduct({...editingProduct, ageGroup: e.target.value})}
                >
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>

                {!user?.isAdmin && (
                  <div className="bg-yellow-50 p-4 rounded-2xl">
                    <p className="text-xs text-yellow-600 font-bold mb-2 flex items-center gap-2">
                      <Info size={16} /> ⚠️ Al editar, la publicación volverá a estar en revisión hasta que un administrador la apruebe nuevamente.
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[#f67280] text-white py-5 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest hover:bg-[#355c7d] transition-all"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(editingProduct.id)}
                    className="px-8 bg-red-600 text-white py-5 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest hover:bg-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Venta (con carga de imagen y Drag & Drop) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="hidden md:block w-1/3 bg-[#f67280] p-10 text-white flex flex-col justify-between">
              <div>
                <h2 className="text-4xl font-serif italic mb-2">Pijamas</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Nueva Publicación</p>
              </div>
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} />
                  <span className="text-xs">Estado: Iniciada</span>
                </div>
                <div className="w-full bg-white/20 h-1 rounded-full">
                  <div className="w-1/4 bg-white h-1 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-bold tracking-tight text-[#355c7d]">Vende tu Prenda</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleUpload} className="space-y-6">
                <DraggableImageUploader
                  images={newProduct.images}
                  onImagesChange={(images) => setNewProduct({...newProduct, images})}
                  maxImages={5}
                />

                <input
                  type="text"
                  placeholder="Título *"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                  required
                />

                <textarea
                  placeholder="Descripción del producto"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d] h-24"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />

                <input
                  type="number"
                  placeholder="Precio ($) *"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  required
                />

                {newProduct.price && (
                  <div className="bg-[#f8b195]/10 p-4 rounded-2xl">
                    <p className="text-sm text-[#6c5b7b] mb-1">
                      <span className="font-bold text-[#355c7d]">Comisión Pijamas (19%):</span> {"$" + (parseInt(newProduct.price) * COMISION).toLocaleString()}
                    </p>
                    <p className="text-sm text-[#6c5b7b]">
                      <span className="font-bold text-[#355c7d]">Neto a cobrar:</span> {"$" + (parseInt(newProduct.price) - parseInt(newProduct.price) * COMISION).toLocaleString()}
                    </p>
                  </div>
                )}

                <input
                  type="number"
                  placeholder="Cuotas sin interés (solo número, ej: 12)"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={newProduct.cuotas}
                  onChange={(e) => setNewProduct({...newProduct, cuotas: e.target.value})}
                />

                <input
                  type="tel"
                  placeholder="WhatsApp para notificaciones de venta *"
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl py-3.5 px-5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={newProduct.whatsappNumber}
                  onChange={(e) => setNewProduct({...newProduct, whatsappNumber: e.target.value})}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
                    required
                  >
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                    value={newProduct.category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      setNewProduct({...newProduct, category: newCategory});
                    }}
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {(newProduct.category === 'pijamas' || newProduct.category === 'trajes_baño') && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-[#355c7d]">Medidas (cm)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Hombro a hombro"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={newProduct.shoulderToShoulder}
                        onChange={(e) => setNewProduct({...newProduct, shoulderToShoulder: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Axila a axila"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={newProduct.armpitToArmpit}
                        onChange={(e) => setNewProduct({...newProduct, armpitToArmpit: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Largo"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={newProduct.length}
                        onChange={(e) => setNewProduct({...newProduct, length: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Cintura"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={newProduct.waist}
                        onChange={(e) => setNewProduct({...newProduct, waist: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Cadera"
                        className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                        value={newProduct.hip}
                        onChange={(e) => setNewProduct({...newProduct, hip: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                    value={newProduct.condition}
                    onChange={(e) => setNewProduct({...newProduct, condition: e.target.value})}
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <select
                  className="w-full bg-[#f8b195]/10 border border-[#c06c84]/20 rounded-2xl p-3.5 outline-none focus:ring-1 focus:ring-[#f67280] text-[#355c7d]"
                  value={newProduct.ageGroup}
                  onChange={(e) => setNewProduct({...newProduct, ageGroup: e.target.value})}
                >
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>

                <div className="bg-[#f8b195]/20 p-4 rounded-2xl">
                  <p className="text-xs text-[#355c7d] font-bold mb-2">Progreso de publicación:</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-[#f67280] text-white flex items-center justify-center">
                        <Check size={12} />
                      </div>
                      <span className="text-[8px] text-[#355c7d]">Iniciada</span>
                    </div>
                    <div className="w-4 h-[2px] bg-[#c06c84]/30"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-[#c06c84]/30 flex items-center justify-center text-[8px] text-[#6c5b7b]">2</div>
                      <span className="text-[8px] text-[#355c7d]">Verificada</span>
                    </div>
                    <div className="w-4 h-[2px] bg-[#c06c84]/30"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-[#c06c84]/30 flex items-center justify-center text-[8px] text-[#6c5b7b]">3</div>
                      <span className="text-[8px] text-[#355c7d]">Aprobada</span>
                    </div>
                    <div className="w-4 h-[2px] bg-[#c06c84]/30"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-[#c06c84]/30 flex items-center justify-center text-[8px] text-[#6c5b7b]">4</div>
                      <span className="text-[8px] text-[#355c7d]">Publicada</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#f67280] text-white py-5 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest hover:bg-[#355c7d] transition-all mt-4"
                >
                  Publicar Ahora
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Métodos de Pago --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#355c7d]">Elegí cómo pagar</h3>
              <button onClick={() => setIsPaymentModalOpen(false)}><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setSelectedPaymentMethod('mercadopago');
                  handlePayment();
                }}
                className="w-full bg-[#f67280] text-white p-6 rounded-2xl font-bold text-lg flex items-center justify-between hover:bg-[#355c7d] transition-all"
              >
                <span>MercadoPago</span>
                <CreditCard size={24} />
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    console.log("💰 Click en Transferencia Bancaria");
                    setSelectedPaymentMethod('transferencia');
                    setIsPaymentModalOpen(false);
                    setIsReceiptModalOpen(true);
                  }}
                  className="w-full bg-[#6c5b7b] text-white p-6 rounded-2xl font-bold text-lg flex items-center justify-between hover:bg-[#355c7d] transition-all"
                >
                  <div className="text-left">
                    <span>Transferencia Bancaria</span>
                    <p className="text-xs opacity-90 mt-1">5% OFF - Ahorrá ${(cartTotal * 0.05).toLocaleString()}</p>
                  </div>
                  <DollarSign size={24} />
                </button>
                <span className="absolute -top-2 -right-2 bg-[#f67280] text-white text-[8px] font-bold px-2 py-1 rounded-full animate-pulse">
                  5% OFF
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-[#6c5b7b] mt-6">
              Total a pagar: <span className="font-bold text-[#f67280]">${cartTotal.toLocaleString()}</span>
            </p>
          </div>
        </div>
      )}

      {/* --- Modal de Carga de Comprobante (Transferencia) --- */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#355c7d]/60 backdrop-blur-sm" onClick={() => setIsReceiptModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#355c7d]">Datos para transferencia</h3>
              <button onClick={() => setIsReceiptModalOpen(false)}><X size={24} /></button>
            </div>

            <div className="bg-[#f8b195]/20 p-6 rounded-2xl mb-6">
              <p className="text-sm font-bold text-[#355c7d] mb-4">💰 Beneficio: 5% OFF</p>
              <p className="text-xs mb-1"><span className="font-bold text-[#355c7d]">Alias:</span> <span className="text-[#f67280]">ih.pijamas</span></p>
              <p className="text-xs mb-1"><span className="font-bold text-[#355c7d]">CBU:</span> 4530000800015997551907</p>
              <p className="text-xs mb-1"><span className="font-bold text-[#355c7d]">Caja de ahorro en pesos:</span> 1599755190</p>
              <p className="text-xs mb-1"><span className="font-bold text-[#355c7d]">Titular:</span> Ingrid Huck</p>
              <p className="text-xs mb-1"><span className="font-bold text-[#355c7d]">CUIL:</span> 27344003799</p>
              <p className="text-xs"><span className="font-bold text-[#355c7d]">Banco:</span> Naranja X</p>
              
              <div className="mt-4 p-3 bg-[#f8b195]/30 rounded-xl">
                <p className="text-xs font-bold text-[#355c7d]">Total con descuento:</p>
                <p className="text-2xl font-black text-[#f67280]">${cartTotalWithDiscount.toLocaleString()}</p>
                <p className="text-[8px] text-[#6c5b7b]">(Ahorrás ${(cartTotal * 0.05).toLocaleString()})</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#c06c84]/30 rounded-2xl p-6 text-center">
                <Upload size={32} className="mx-auto mb-2 text-[#f67280]" />
                <p className="text-sm font-bold text-[#355c7d] mb-2">Subí tu comprobante</p>
                <p className="text-[10px] text-[#6c5b7b] mb-4">Formatos: JPG, PNG (máx. 5MB)</p>
                <label className="inline-block bg-[#f67280] text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase cursor-pointer hover:bg-[#355c7d] transition-all">
                  Seleccionar archivo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={() => {
                  for (let i = 0; i < cart.length; i++) {
                    const item = cart[i];
                    const { discounted } = getDiscountedPrice(item);
                    handleMarkAsSold(item.id, user.uid, 'transferencia', discounted);
                  }
                  setCart([]);
                  setIsReceiptModalOpen(false);
                  alert("¡Gracias por tu compra! El administrador se comunicará contigo para coordinar la entrega.");
                  window.open(`https://wa.me/5491128711097?text=¡Hola! Realicé una compra en Pijamas y ya realicé la transferencia.`, "_blank");
                }}
                className="w-full text-[10px] text-[#f67280] underline mt-2"
              >
                Ya realicé la transferencia (simular)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Sidebar Carrito (con precios con descuento) --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-[#355c7d]/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-8 border-b border-[#c06c84]/20 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-light text-[#355c7d]">Tu Selección</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#f67280]">{cart.length} artículos añadidos</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {cart.map(item => {
                const { original, discounted, hasDiscount } = getDiscountedPrice(item);
                return (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-24 bg-[#f8b195]/10 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.images ? item.images[0] : item.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="text-xs font-bold text-[#355c7d] font-serif">{item.title}</h4>
                        <p className="text-[10px] text-[#6c5b7b] uppercase mt-1">
                          Talle {item.size}
                        </p>
                        {item.cuotas && (
                          <p className="text-[8px] text-[#f67280] font-bold mt-1">{item.cuotas}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {hasDiscount ? (
                          <div>
                            <span className="text-[10px] text-[#6c5b7b] line-through mr-1">${original.toLocaleString()}</span>
                            <span className="text-sm font-black text-green-600">${discounted.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-black text-[#355c7d]">${original.toLocaleString()}</span>
                        )}
                        <button onClick={() => removeFromCart(item.id)} className="text-[#c06c84] hover:text-[#f67280] transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {cart.length > 0 && (
              <div className="p-8 bg-[#f8b195]/10 border-t border-[#c06c84]/20">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6c5b7b]">Total Estimado</span>
                  <span className="text-2xl font-black text-[#355c7d]">${cartTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsPaymentModalOpen(true);
                  }}
                  className="w-full bg-[#f67280] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#355c7d] transition-all flex items-center justify-center gap-2"
                >
                  Continuar con el pago <ArrowRight size={16} />
                </button>
                <p className="text-[8px] text-center text-[#6c5b7b] mt-4">
                  *Los productos se reservan hasta confirmar el pago
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Nav Móvil --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#c06c84]/20 h-18 flex items-center justify-around z-50 px-6 shadow-2xl">
        <button 
          className="text-[#6c5b7b] p-2 hover:text-[#355c7d] transition-colors" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Search size={22} />
        </button>
        
        <button 
          className="text-[#6c5b7b] p-2 relative hover:text-[#355c7d] transition-colors" 
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingBag size={22} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#f67280] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
        
        <button 
          className="text-[#6c5b7b] p-2 hover:text-[#355c7d] transition-colors" 
          onClick={() => {
            if (user) {
              setSelectedUserProfile(user.uid);
            } else {
              handleGoogleLogin();
            }
          }}
        >
          <User size={22} />
        </button>
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: #f8b19510;
        }
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .h-18 {
          height: 4.5rem;
        }
      `}</style>
    </div>
  );
}
