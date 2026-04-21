import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ShoppingBag, User, Heart, PlusCircle, X, Camera, ChevronRight, Trash2, ArrowRight, Tag, Check, Edit3, Lock, CheckCircle, Clock, AlertCircle, LogOut, Settings, Image as ImageIcon, Users, ThumbsUp, UserPlus, UserCheck, ChevronLeft, ChevronRight as ChevronRightIcon, Info, Download, MessageCircle, Send, DollarSign, Crop, Move, Maximize2, Minimize2, Ban, MessageSquare, Bell, Phone, CreditCard, Upload, ZoomIn, FileText, HelpCircle, Smartphone, Paperclip, GripVertical } from 'lucide-react';
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

// --- Configuración y Constantes ---
const COMISION = 0.19; // 19% de comisión

// Lista inicial de usuarios autorizados para publicar
const INITIAL_AUTHORIZED_SELLERS = [
  "rodrigo.n.arena@hotmail.com",
  "outlet.masroma@gmail.com",
  "feria.masroma@gmail.com",
  "romina.arena89@gmail.com"
];

// Email del administrador principal (puede gestionar usuarios autorizados)
const MAIN_ADMIN_EMAIL = "rodrigo.n.arena@hotmail.com";

const CATEGORIES = [
  { id: 'remeras', name: 'Remeras', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=200' },
  { id: 'camisas', name: 'Camisas', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=200' },
  { id: 'buzos', name: 'Buzos', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=200' },
  { id: 'vestidos', name: 'Vestidos', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=200' },
  { id: 'jeans', name: 'Jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=200' },
  { id: 'pantalones', name: 'Pantalones', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=200' },
  { id: 'camperas', name: 'Camperas', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=200' },
  { id: 'calzado', name: 'Calzado', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200' },
  { id: 'short', name: 'Short', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=200' },
  { id: 'gorras', name: 'Gorras', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=200' },
  { id: 'accesorios', name: 'Accesorios', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=200' },
  { id: 'ropa-interior', name: 'Ropa interior', image: '/corpino.png' },
  { id: 'maquillajes', name: 'Maquillajes', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=200' },
  { id: 'tecnologia', name: 'Tecnología', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=200' },
  { id: 'electrodomesticos', name: 'Electrodomésticos', image: 'electro.png' },
];

const CONDITIONS = ["Ropa nueva con etiqueta", "Ropa nueva sin etiqueta", "Ropa como nueva", "Ropa usada"];
const AGE_GROUPS = ["Bebés", "Kids", "Juvenil", "Adulto", "Mayor"];
const GENDERS = ["Masculino", "Femenino", "Unisex"];
const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "Único"];
const SHOE_SIZES = Array.from({ length: 31 }, (_, i) => (i + 20).toString());

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
const SortableImage = ({ image, index, onRemove }) => {
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
        Arrastra las imágenes para reordenarlas. Se comprimirán automáticamente.
      </p>
    </div>
  );
};

export default function App() {
  // --- Tutorial de primera vez ---
  const [showFirstTimeTutorial, setShowFirstTimeTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setTimeout(() => {
        setShowFirstTimeTutorial(true);
      }, 1000);
    }
  }, []);

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
      modal.className = 'fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-[#d4af37] z-[1000] p-6 animate-slide-up';
      modal.innerHTML = `
        <div class="flex items-center gap-4 mb-4">
          <img src="/icon.png" alt="+Roma" class="w-12 h-12 rounded-xl" />
          <div>
            <h3 class="font-bold text-lg">Instalar +Roma</h3>
            <p class="text-xs text-slate-500">Accede más rápido a tu tienda favorita</p>
          </div>
        </div>
        <p class="text-sm text-slate-600 mb-6">Instala nuestra app para una experiencia más rápida y poder comprar incluso sin conexión.</p>
        <div class="flex gap-3">
          <button id="install-cancel" class="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
            Ahora no
          </button>
          <button id="install-confirm" class="flex-1 bg-[#d4af37] text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all">
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
      alert('¡Gracias por instalar +Roma! 🎉');
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
    modal.className = 'fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-blue-500 z-[1000] p-6 animate-slide-up';
    modal.innerHTML = `
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <button id="update-now" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all">
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
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
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
  const [isChatOpen, setIsChatOpen] = useState(false);
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
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [newImageMessage, setNewImageMessage] = useState(null);
  const [messagesEndRef, setMessagesEndRef] = useState(null);
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

  // Estados para el Banner SALE y Administración
  const [saleClicks, setSaleClicks] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [saleConfig, setSaleConfig] = useState({
    title: "¡GRAN LIQUIDACIÓN DE TEMPORADA!",
    promo: "50% OFF",
    vigencia: "Válido hasta el 28 de febrero",
    active: true
  });

  // Estados para los filtros
  const [showOutletFilters, setShowOutletFilters] = useState(false);
  const [showShowroomFilters, setShowShowroomFilters] = useState(false);
  const [selectedOutletFilter, setSelectedOutletFilter] = useState(null);
  const [selectedShowroomFilter, setSelectedShowroomFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGender, setSelectedGender] = useState("Todo");
  const [selectedAge, setSelectedAge] = useState("Todo");
  const [selectedConditionGroup, setSelectedConditionGroup] = useState("Todas");

  // Estados para seguidores y likes recibidos
  const [followers, setFollowers] = useState({});
  const [following, setFollowing] = useState({});
  const [productLikes, setProductLikes] = useState({});

  // Nuevo Producto
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    size: "M",
    shoeSize: "",
    images: [],
    condition: "Ropa usada",
    category: "remeras",
    gender: "Femenino",
    ageGroup: "Adulto",
    cuotas: "",
    whatsappNumber: "",
    // Medidas para parte superior
    shoulderToShoulder: "",
    armpitToArmpit: "",
    length: "",
    // Medidas para parte inferior
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
        // Inicializar con los valores por defecto
        INITIAL_AUTHORIZED_SELLERS.forEach(async (email) => {
          await addDoc(collection(db, "authorizedSellers"), { email });
        });
      }
    };
    loadAuthorizedSellers();
  }, []);

  // Cargar datos desde Firestore
  useEffect(() => {
    // Productos publicados (incluyendo vendidos)
    const publishedUnsubscribe = onSnapshot(
      query(collection(db, "products"), where("status.publicada", "==", true)),
      (snapshot) => {
        const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsList);
      }
    );

    // Productos pendientes
    const pendingUnsubscribe = onSnapshot(
      query(collection(db, "products"), where("status.publicada", "==", false)),
      (snapshot) => {
        const pendingList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingProducts(pendingList);
      }
    );

    // Cargar usuarios
    const usersUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersMap = {};
      snapshot.docs.forEach(doc => {
        usersMap[doc.id] = { id: doc.id, ...doc.data() };
      });
      setUsers(usersMap);
    });

    // Cargar seguidores
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

    // Cargar following
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

    // Cargar preguntas
    const questionsUnsubscribe = onSnapshot(
      query(collection(db, "questions"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const questionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuestions(questionsList);
      }
    );

    // Cargar chats
    const chatsUnsubscribe = onSnapshot(
      query(collection(db, "chats"), orderBy("lastMessageAt", "desc")),
      (snapshot) => {
        const chatsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChats(chatsList);
      }
    );

    // Cargar notificaciones
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

    // Cargar comprobantes
    const receiptsUnsubscribe = onSnapshot(
      query(collection(db, "receipts"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const receiptsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReceipts(receiptsList);
      }
    );

    // Cargar usuarios autorizados
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
      chatsUnsubscribe();
      notificationsUnsubscribe();
      receiptsUnsubscribe();
      authorizedUnsubscribe();
    };
  }, [user]);

  // Cargar mensajes del chat seleccionado
  useEffect(() => {
    if (selectedChat) {
      const messagesUnsubscribe = onSnapshot(
        query(collection(db, "messages", selectedChat.id, "chatMessages"), orderBy("timestamp", "asc")),
        (snapshot) => {
          const messagesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(prev => ({ ...prev, [selectedChat.id]: messagesList }));
          
          // Marcar mensajes como leídos
          if (user) {
            messagesList.forEach(async (msg) => {
              if (msg.senderId !== user.uid && !msg.read) {
                const msgRef = doc(db, "messages", selectedChat.id, "chatMessages", msg.id);
                await updateDoc(msgRef, { read: true });
              }
            });
          }
        }
      );
      return () => messagesUnsubscribe();
    }
  }, [selectedChat, user]);

  // Efecto para monitorear el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", firebaseUser.uid)));
        
        // Verificar si es el administrador principal
        const isMainAdmin = firebaseUser.email === MAIN_ADMIN_EMAIL;
        
        if (!userDoc.empty) {
          const existingUser = userDoc.docs[0].data();
          setUser(existingUser);
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
            canPublish: authorizedSellers.includes(firebaseUser.email) || isMainAdmin
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
  }, [authorizedSellers]);

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

  const handleChatImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file, 800, 0.6);
        setNewImageMessage(compressedImage);
      } catch (error) {
        console.error('Error comprimiendo imagen:', error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImageMessage(reader.result);
        };
        reader.readAsDataURL(file);
      }
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

    // Verificar si el usuario puede publicar
    if (!user.canPublish && !user.isMainAdmin) {
      alert("No tienes permiso para publicar productos. Contacta al administrador.");
      return;
    }

    // Validaciones obligatorias
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

    if (newProduct.category === 'calzado' && !newProduct.shoeSize) {
      alert("Debes seleccionar un talle de calzado");
      return;
    }

    if (newProduct.category !== 'calzado' && !newProduct.size) {
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
      shoeSize: newProduct.shoeSize,
      condition: newProduct.condition,
      category: newProduct.category,
      gender: newProduct.gender,
      ageGroup: newProduct.ageGroup,
      cuotas: (newProduct.cuotas && parseInt(newProduct.cuotas) > 0) ? (newProduct.cuotas + " cuotas sin interés") : "",
      whatsappNumber: newProduct.whatsappNumber,
      // Medidas
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

    // Guardar el producto en Firestore
    const productRef = await addDoc(collection(db, "products"), productToAdd);

    // Crear notificación para el usuario
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

    // Buscar administradores
    const adminUsers = await getDocs(query(collection(db, "users"), where("isAdmin", "==", true)));
    
    // Crear chat automático entre administrador y vendedor
    adminUsers.docs.forEach(async (adminDoc) => {
      const chatData = {
        productId: productRef.id,
        productTitle: newProduct.title,
        productImage: newProduct.images[0],
        sellerId: user.uid,
        sellerName: user.name,
        sellerAvatar: user.avatar,
        adminId: adminDoc.id,
        adminName: adminDoc.data().name,
        adminAvatar: adminDoc.data().avatar,
        participants: [user.uid, adminDoc.id],
        lastMessage: "📦 Nueva publicación pendiente de revisión",
        lastMessageAt: Timestamp.now(),
        unreadCount: {
          [user.uid]: 0,
          [adminDoc.id]: 1
        },
        type: 'product_review',
        createdAt: Timestamp.now()
      };
      
      const chatRef = await addDoc(collection(db, "chats"), chatData);
      
      // Enviar mensaje automático del sistema
      await addDoc(collection(db, "messages", chatRef.id, "chatMessages"), {
        senderId: 'system',
        senderName: 'Sistema +Roma',
        senderAvatar: '/masroma.png',
        text: `📦 **Nueva publicación para revisar**\n\nProducto: ${newProduct.title}\nPrecio: $${precio.toLocaleString()}\n\nEl administrador revisará esta publicación y te contactará si necesita más información.`,
        timestamp: Timestamp.now(),
        read: false,
        system: true
      });

      // Notificar al administrador
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

    // ✅ Cerrar el modal
    setIsModalOpen(false);
    
    // ✅ Resetear el formulario
    setNewProduct({
      title: "",
      description: "",
      price: "",
      size: "M",
      shoeSize: "",
      images: [],
      condition: "Ropa usada",
      category: "remeras",
      gender: "Femenino",
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

    // ✅ Mostrar mensaje de éxito
    alert("✅ ¡Producto enviado para revisión! Recibirás una notificación cuando sea aprobado.");
  };

  const handlePublishProduct = async (productId) => {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      'status.publicada': true,
      'status.aprobada': true
    });

    // Notificar al vendedor
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
      
      // Eliminar preguntas asociadas
      const questionsQuery = query(collection(db, "questions"), where("productId", "==", productId));
      const questionsSnapshot = await getDocs(questionsQuery);
      questionsSnapshot.docs.forEach(async (questionDoc) => {
        await deleteDoc(questionDoc.ref);
      });

      // Eliminar chats asociados
      const chatsQuery = query(collection(db, "chats"), where("productId", "==", productId));
      const chatsSnapshot = await getDocs(chatsQuery);
      chatsSnapshot.docs.forEach(async (chatDoc) => {
        // Eliminar mensajes del chat
        const messagesRef = collection(db, "messages", chatDoc.id, "chatMessages");
        const messagesSnapshot = await getDocs(messagesRef);
        messagesSnapshot.docs.forEach(async (msgDoc) => {
          await deleteDoc(msgDoc.ref);
        });
        await deleteDoc(chatDoc.ref);
      });
    }
  };

  const handleMarkAsSold = async (productId, buyerId, paymentMethod = 'mercadopago') => {
    if (window.confirm("¿Marcar esta prenda como vendida?")) {
      const productRef = doc(db, "products", productId);
      const product = [...products, ...pendingProducts].find(p => p.id === productId);
      
      await updateDoc(productRef, {
        sold: true,
        buyerId: buyerId,
        soldAt: Timestamp.now(),
        paymentMethod: paymentMethod
      });

      // Actualizar total ganado del vendedor
      const sellerRef = doc(db, "users", product.userId);
      await updateDoc(sellerRef, {
        totalEarned: increment(product.montoNeto)
      });

      // Enviar notificación en la app al vendedor
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

      // Enviar WhatsApp al vendedor
      if (product.whatsappNumber) {
        const mensaje = encodeURIComponent(
          `¡Hola ${product.user.name}! Tu producto "${product.title}" ha sido vendido en +Roma.\n\n` +
          `Precio de venta: $${product.price.toLocaleString()}\n` +
          `Neto a cobrar (después de comisión del 19%): $${product.montoNeto.toLocaleString()}\n\n` +
          `Por favor, prepara el producto para su envío. En breve recibirás instrucciones de despacho.\n\n` +
          `Gracias por vender con +Roma.`
        );
        window.open(`https://wa.me/${product.whatsappNumber}?text=${mensaje}`, "_blank");
      }

      // Crear notificación para el comprador
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

      // Crear chat privado entre administrador y comprador
      const adminUsers = await getDocs(query(collection(db, "users"), where("isAdmin", "==", true)));
      adminUsers.docs.forEach(async (adminDoc) => {
        const chatData = {
          productId: productId,
          productTitle: product.title,
          productImage: product.images ? product.images[0] : product.image,
          buyerId: buyerId,
          buyerName: users[buyerId]?.name || "Comprador",
          buyerAvatar: users[buyerId]?.avatar,
          adminId: adminDoc.id,
          adminName: adminDoc.data().name,
          adminAvatar: adminDoc.data().avatar,
          participants: [buyerId, adminDoc.id],
          lastMessage: "Chat iniciado por compra realizada",
          lastMessageAt: Timestamp.now(),
          unreadCount: {
            [buyerId]: 0,
            [adminDoc.id]: 1
          }
        };
        await addDoc(collection(db, "chats"), chatData);
      });
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedReceipt = await compressImage(file, 1000, 0.6);
      
      const receiptData = {
        userId: user.uid,
        userName: user.name,
        userAvatar: user.avatar,
        cart: cart.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          size: item.category === 'calzado' ? item.shoeSize : item.size
        })),
        total: cartTotal,
        receipt: compressedReceipt,
        receiptName: file.name,
        createdAt: Timestamp.now(),
        processed: false
      };

      await addDoc(collection(db, "receipts"), receiptData);
      
      // Marcar productos como vendidos
      for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        await handleMarkAsSold(item.id, user.uid, 'transferencia');
      }

      setCart([]);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(false);
      alert("¡Comprobante subido con éxito! El administrador se comunicará contigo para coordinar la entrega.");
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
    const total = cartTotal;
    
    window.open("https://link.mercadopago.com.ar/masroma?amount=" + total, "_blank");
    
    let productosTexto = "";
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const talle = item.category === 'calzado' ? item.shoeSize : item.size;
      productosTexto = productosTexto + "- " + item.title + " (Talle: " + talle + ") - $" + item.price;
      if (i < cart.length - 1) {
        productosTexto = productosTexto + "\n";
      }
    }

    const mensaje = encodeURIComponent(
      "¡Hola! Realicé una compra en +Roma:\n\n" +
      productosTexto +
      "\n\nTotal: $" + total +
      "\n\nTe adjunto el comprobante de pago."
    );

    // Marcar productos como vendidos
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      handleMarkAsSold(item.id, user.uid, 'mercadopago');
    }

    window.open("https://wa.me/5491124689196?text=" + mensaje, "_blank");

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

  const handleSendMessage = async (chatId) => {
    if ((!newMessage.trim() && !newImageMessage) || !user) return;

    let messageData = {
      senderId: user.uid,
      senderName: user.name,
      senderAvatar: user.avatar,
      timestamp: Timestamp.now(),
      read: false
    };

    if (newImageMessage) {
      messageData.text = "📷 Imagen";
      messageData.image = newImageMessage;
      messageData.hasImage = true;
    } else {
      messageData.text = newMessage;
    }

    await addDoc(collection(db, "messages", chatId, "chatMessages"), messageData);

    // Actualizar último mensaje del chat
    const chatRef = doc(db, "chats", chatId);
    const chat = chats.find(c => c.id === chatId);
    
    // Determinar el otro participante
    const otherParticipant = chat.participants.find(p => p !== user.uid);
    
    await updateDoc(chatRef, {
      lastMessage: newImageMessage ? "📷 Imagen" : newMessage,
      lastMessageAt: Timestamp.now(),
      [`unreadCount.${otherParticipant}`]: (chat.unreadCount?.[otherParticipant] || 0) + 1
    });

    // Notificar al otro usuario
    await addDoc(collection(db, "notifications"), {
      userId: otherParticipant,
      type: "new_message",
      title: `Nuevo mensaje de ${user.name}`,
      message: newImageMessage ? "📷 Te envió una imagen" : newMessage.substring(0, 50) + (newMessage.length > 50 ? '...' : ''),
      chatId: chatId,
      read: false,
      createdAt: Timestamp.now()
    });

    setNewMessage("");
    setNewImageMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  // Gestión de usuarios autorizados
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
    if (email === MAIN_ADMIN_EMAIL) {
      alert("No puedes eliminar al administrador principal");
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

  const getUserChats = () => {
    if (!user) return [];
    return chats.filter(chat => chat.participants.includes(user.uid));
  };

  const getUserNotifications = () => {
    if (!user) return [];
    return notifications.filter(n => n.userId === user.uid);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCat = !selectedCategory || p.category === selectedCategory;
      const matchesGender = selectedGender === "Todo" || p.gender === selectedGender;
      const matchesAge = selectedAge === "Todo" || p.ageGroup === selectedAge;
      
      let matchesCondition = true;
      if (selectedOutletFilter) {
        matchesCondition = p.condition === selectedOutletFilter;
      } else if (selectedShowroomFilter) {
        matchesCondition = p.condition === selectedShowroomFilter;
      } else if (selectedConditionGroup !== "Todas") {
        matchesCondition = p.condition === selectedConditionGroup;
      }
      
      return matchesSearch && matchesCat && matchesGender && matchesAge && matchesCondition;
    });
  }, [products, searchTerm, selectedCategory, selectedGender, selectedAge, selectedOutletFilter, selectedShowroomFilter, selectedConditionGroup]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const cartTotalWithDiscount = cartTotal * 0.95; // 5% de descuento para transferencia

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

  const handleOutletClick = () => {
    setShowOutletFilters(!showOutletFilters);
    setShowShowroomFilters(false);
  };

  const handleShowroomClick = () => {
    setShowShowroomFilters(!showShowroomFilters);
    setShowOutletFilters(false);
  };

  const handleOutletFilterSelect = (filter) => {
    setSelectedOutletFilter(filter);
    setSelectedShowroomFilter(null);
    setSelectedConditionGroup(filter);
    setShowOutletFilters(false);
  };

  const handleShowroomFilterSelect = (filter) => {
    setSelectedShowroomFilter(filter);
    setSelectedOutletFilter(null);
    setSelectedConditionGroup(filter);
    setShowShowroomFilters(false);
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

  const getUnreadChatCount = () => {
    if (!user) return 0;
    let total = 0;
    getUserChats().forEach(chat => {
      if (chat.unreadCount && chat.unreadCount[user.uid]) {
        total += chat.unreadCount[user.uid];
      }
    });
    return total;
  };

  const handleAdminStartChat = async (sellerId, productId) => {
    if (!user?.isAdmin) return;

    const product = [...products, ...pendingProducts].find(p => p.id === productId);
    const seller = users[sellerId];

    const existingChat = chats.find(chat => 
      chat.participants.includes(user.uid) && 
      chat.participants.includes(sellerId) &&
      chat.productId === productId
    );

    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      const chatData = {
        productId: productId,
        productTitle: product.title,
        productImage: product.images ? product.images[0] : product.image,
        sellerId: sellerId,
        sellerName: seller.name,
        sellerAvatar: seller.avatar,
        adminId: user.uid,
        adminName: user.name,
        adminAvatar: user.avatar,
        participants: [sellerId, user.uid],
        lastMessage: "Chat iniciado por administrador",
        lastMessageAt: Timestamp.now(),
        unreadCount: {
          [sellerId]: 1,
          [user.uid]: 0
        },
        type: 'product_review'
      };
      const chatRef = await addDoc(collection(db, "chats"), chatData);
      
      // Enviar mensaje de bienvenida
      await addDoc(collection(db, "messages", chatRef.id, "chatMessages"), {
        senderId: 'system',
        senderName: 'Sistema +Roma',
        senderAvatar: '/masroma.png',
        text: `👋 Chat iniciado por el equipo de +Roma para revisar el producto: ${product.title}. ¿En qué podemos ayudarte?`,
        timestamp: Timestamp.now(),
        read: false,
        system: true
      });

      setSelectedChat({ id: chatRef.id, ...chatData });
    }
    setIsChatOpen(false);
  };

  const handleAdminStartDirectChat = async (targetUser) => {
    if (!user?.isAdmin) return;

    // Buscar si ya existe un chat directo entre admin y este usuario
    const existingChat = chats.find(chat => 
      chat.participants.includes(user.uid) && 
      chat.participants.includes(targetUser.uid) &&
      chat.type === 'direct_message'
    );

    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      // Crear nuevo chat directo
      const chatData = {
        type: 'direct_message',
        adminId: user.uid,
        adminName: user.name,
        adminAvatar: user.avatar,
        userId: targetUser.uid,
        userName: targetUser.name,
        userAvatar: targetUser.avatar,
        participants: [user.uid, targetUser.uid],
        lastMessage: "Chat iniciado por administrador",
        lastMessageAt: Timestamp.now(),
        unreadCount: {
          [user.uid]: 0,
          [targetUser.uid]: 1
        },
        createdAt: Timestamp.now()
      };

      const chatRef = await addDoc(collection(db, "chats"), chatData);
      
      // Enviar mensaje de bienvenida automático
      await addDoc(collection(db, "messages", chatRef.id, "chatMessages"), {
        senderId: 'system',
        senderName: 'Sistema +Roma',
        senderAvatar: '/masroma.png',
        text: `👋 Chat iniciado por el equipo de +Roma. ¿En qué podemos ayudarte?`,
        timestamp: Timestamp.now(),
        read: false,
        system: true
      });

      // Notificar al usuario
      await addDoc(collection(db, "notifications"), {
        userId: targetUser.uid,
        type: "new_chat",
        title: "Nuevo mensaje de +Roma",
        message: "El equipo de +Roma ha iniciado un chat contigo.",
        chatId: chatRef.id,
        read: false,
        createdAt: Timestamp.now()
      });

      setSelectedChat({ id: chatRef.id, ...chatData });
    }
    
    // Cerrar panel de admin y abrir chat
    setShowAdminModal(false);
  };

  const closeTutorial = () => {
    setShowFirstTimeTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 pb-20 selection:bg-[#d4af37]/30">
      {/* --- Tutorial de primera vez --- */}
      {showFirstTimeTutorial && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeTutorial}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <HelpCircle className="text-[#d4af37]" size={28} />
                ¡Bienvenido a +Roma!
              </h3>
              <button onClick={closeTutorial} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            {tutorialStep === 0 && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl text-center">
                  <div className="w-24 h-24 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera size={40} className="text-[#d4af37]" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Paso 1: Fotos del producto</h4>
                  <p className="text-sm text-slate-600">Tomá fotos claras de tu prenda desde diferentes ángulos. Podés subir hasta 5 imágenes.</p>
                </div>
                <button
                  onClick={() => setTutorialStep(1)}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            )}

            {tutorialStep === 1 && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl text-center">
                  <div className="w-24 h-24 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tag size={40} className="text-[#d4af37]" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Paso 2: Completá los datos</h4>
                  <p className="text-sm text-slate-600">Agregá título, descripción, precio, talle y condición de la prenda.</p>
                </div>
                <button
                  onClick={() => setTutorialStep(2)}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            )}

            {tutorialStep === 2 && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl text-center">
                  <div className="w-24 h-24 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={40} className="text-[#d4af37]" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Paso 3: Revisión</h4>
                  <p className="text-sm text-slate-600">Tu publicación pasará por revisión. Una vez aprobada, aparecerá en el catálogo.</p>
                </div>
                <button
                  onClick={() => setTutorialStep(3)}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              </div>
            )}

            {tutorialStep === 3 && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl text-center">
                  <div className="w-24 h-24 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={40} className="text-[#d4af37]" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">¡Listo para vender!</h4>
                  <p className="text-sm text-slate-600">Cuando alguien compre tu producto, recibirás una notificación por WhatsApp y en la app.</p>
                </div>
                <button
                  onClick={closeTutorial}
                  className="w-full bg-[#d4af37] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  Comenzar <ShoppingBag size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Tutorial de descarga en iPhone --- */}
      {showDownloadTutorial && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDownloadTutorial(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Smartphone className="text-[#d4af37]" size={28} />
                Instalar en iPhone
              </h3>
              <button onClick={() => setShowDownloadTutorial(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-bold mb-1">Abrí Safari</p>
                  <p className="text-sm text-slate-600">Esta función solo está disponible en el navegador Safari de iPhone.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-bold mb-1">Tocá el botón Compartir</p>
                  <p className="text-sm text-slate-600">Es el ícono rectangular con una flecha hacia arriba, en la parte inferior de la pantalla.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-bold mb-1">Seleccioná "Agregar a Inicio"</p>
                  <p className="text-sm text-slate-600">Desplazate hacia abajo en el menú y elegí "Agregar a la pantalla de inicio".</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <p className="font-bold mb-1">Confirmá la instalación</p>
                  <p className="text-sm text-slate-600">Tocá "Agregar" en la esquina superior derecha y la app aparecerá en tu pantalla de inicio.</p>
                </div>
              </div>

              <button
                onClick={() => setShowDownloadTutorial(false)}
                className="w-full bg-[#d4af37] text-white py-4 rounded-xl font-bold text-sm"
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
          className="bg-red-600 text-white py-2 px-4 text-center cursor-pointer select-none transition-all hover:bg-red-700 active:scale-95"
        >
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
            <span className="font-black italic tracking-tighter text-lg">{saleConfig.title}</span>
            <span className="bg-white text-red-600 px-3 py-0.5 rounded-full font-bold text-xs uppercase tracking-widest animate-pulse">
              {saleConfig.promo}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">{saleConfig.vigencia}</span>
          </div>
        </div>
      )}

      {/* --- Navegación --- */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex flex-col cursor-pointer group" onClick={handleLogoClick}>
            <img src="/masroma.png" alt="+Roma" className="h-12 w-auto object-contain" onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }} />
            <span className="hidden text-2xl md:text-3xl font-serif tracking-[0.2em] font-light group-hover:text-[#d4af37] transition-colors uppercase tracking-widest">+Roma</span>
          </div>

          <div className="hidden lg:flex flex-1 max-w-lg mx-12 relative group">
            <input
              type="text"
              placeholder="¿Qué estás buscando hoy?..."
              className="w-full bg-slate-50 rounded-full py-3 px-12 text-sm focus:ring-1 focus:ring-[#d4af37] outline-none transition-all border border-transparent focus:bg-white focus:border-slate-200 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-[#d4af37] transition-colors" size={18} />
          </div>

          <div className="flex items-center gap-4">
            {/* Botón de tutorial de descarga en iPhone */}
            <button
              onClick={() => setShowDownloadTutorial(true)}
              className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
              title="Cómo instalar la app en iPhone"
            >
              <Smartphone size={18} />
              <span>App</span>
            </button>

            <button
              onClick={() => {
                if (user) {
                  if (!user.canPublish && !user.isMainAdmin) {
                    alert("No tienes permiso para publicar. Contacta al administrador.");
                    return;
                  }
                  setIsModalOpen(true);
                } else {
                  alert("Debes iniciar sesión para publicar");
                }
              }}
              className="bg-black text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#d4af37] transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <PlusCircle size={14} />
              <span className="hidden sm:inline">Vender</span>
            </button>

            {/* Notificaciones */}
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-slate-600 hover:text-black transition-colors"
            >
              <Bell size={22} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
              {isNotificationsOpen && user && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 bg-gradient-to-r from-[#d4af37] to-yellow-500 text-white sticky top-0 flex justify-between items-center">
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
                        className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}
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
                            <p className="text-xs text-slate-600">{notif.message}</p>
                            <p className="text-[8px] text-slate-400 mt-1">
                              {notif.createdAt?.toDate().toLocaleString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                    {getUserNotifications().length === 0 && (
                      <div className="p-8 text-center text-slate-400">
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
              className="relative p-2 text-slate-600 hover:text-black transition-colors"
            >
              <ShoppingBag size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-[#d4af37] overflow-hidden">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 bg-gradient-to-r from-[#d4af37] to-yellow-500 text-white">
                      <p className="font-bold truncate">{user.name}</p>
                      <p className="text-xs opacity-80 truncate">{user.email}</p>
                      {user.canPublish && (
                        <span className="text-[8px] bg-green-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Vendedor autorizado
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setSelectedUserProfile(user.uid);
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-xl flex items-center gap-2"
                      >
                        <User size={16} /> Mi Perfil
                      </button>
                      <button
                        onClick={() => {
                          setIsEditProfileOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-xl flex items-center gap-2"
                      >
                        <Settings size={16} /> Editar Perfil
                      </button>
                      <button
                        onClick={() => {
                          setIsQuestionsOpen(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-xl flex items-center gap-2"
                      >
                        <MessageCircle size={16} /> Preguntas ({getUserQuestions(user.uid).filter(q => !q.answer).length})
                      </button>
                      {user.isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setIsBuyersPanelOpen(true);
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-xl flex items-center gap-2"
                          >
                            <Users size={16} /> Compradores ({receipts.filter(r => !r.processed).length})
                          </button>
                          {user.isMainAdmin && (
                            <button
                              onClick={() => {
                                setIsAuthorizedUsersModalOpen(true);
                                setIsProfileOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-xl flex items-center gap-2"
                            >
                              <Lock size={16} /> Gestionar vendedores
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setShowAdminModal(true);
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 rounded-xl flex items-center gap-2"
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
                className="bg-[#d4af37] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
              >
                <User size={14} />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* --- Filtros --- */}
      <div className="bg-white border-b sticky top-20 z-40 overflow-x-auto no-scrollbar shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-6 min-w-max">
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-50">
            {["Todo", "Masculino", "Femenino", "Unisex"].map(g => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={"px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all " +
                  (selectedGender === g ? 'bg-black text-white shadow-md' : 'text-slate-400 hover:text-black')}
              >{g}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {["Todo", ...AGE_GROUPS].map(age => (
              <button
                key={age}
                onClick={() => setSelectedAge(age)}
                className={"px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase border transition-all " +
                  (selectedAge === age ? 'bg-[#d4af37] border-[#d4af37] text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-black')}
              >{age}</button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Categorías con imágenes personalizadas --- */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6">
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={"group flex-shrink-0 cursor-pointer flex flex-col items-center transition-all " +
                (selectedCategory === cat.id ? 'scale-105' : 'opacity-70 hover:opacity-100')}
            >
              <div className={"relative w-20 h-20 md:w-28 md:h-28 rounded-3xl overflow-hidden border-2 transition-all " +
                (selectedCategory === cat.id ? 'border-[#d4af37] shadow-xl' : 'border-transparent shadow-sm')}>
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/5"></div>
              </div>
              <span className={"mt-3 text-[10px] font-black uppercase tracking-[0.2em] " +
                (selectedCategory === cat.id ? 'text-[#d4af37]' : 'text-slate-500')}>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- Catálogo --- */}
      <main className="container mx-auto px-4 lg:px-8 mb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-serif font-light">Explorar Piezas</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colección curada: {filteredProducts.length} items</p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            <button
              onClick={() => {
                setSelectedConditionGroup("Todas");
                setSelectedOutletFilter(null);
                setSelectedShowroomFilter(null);
              }}
              className={"px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap " +
                (selectedConditionGroup === 'Todas' && !selectedOutletFilter && !selectedShowroomFilter ? 'bg-black border-black text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300')}
            >
              Todas
            </button>

            {/* Outlet +Roma con filtros */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOutletClick}
                className={"p-1 rounded-full border transition-all " +
                  (selectedOutletFilter ? 'bg-red-600 border-red-600' : 'bg-white border-slate-100 hover:border-red-300')}
              >
                <img src="/outlet.png" alt="Outlet" className="w-12 h-12 object-contain" />
              </button>
              {showOutletFilters && (
                <>
                  <button
                    onClick={() => handleOutletFilterSelect("Ropa nueva con etiqueta")}
                    className={"px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap " +
                      (selectedOutletFilter === "Ropa nueva con etiqueta" ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-green-300')}
                  >
                    Nueva con etiqueta
                  </button>
                  <button
                    onClick={() => handleOutletFilterSelect("Ropa nueva sin etiqueta")}
                    className={"px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap " +
                      (selectedOutletFilter === "Ropa nueva sin etiqueta" ? 'bg-yellow-600 border-yellow-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-yellow-300')}
                  >
                    Nueva sin etiqueta
                  </button>
                </>
              )}
            </div>

            {/* Showroom +Roma con filtros */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShowroomClick}
                className={"p-1 rounded-full border transition-all " +
                  (selectedShowroomFilter ? 'bg-black border-black' : 'bg-white border-slate-100 hover:border-slate-300')}
              >
                <img src="/showroom.png" alt="Showroom" className="w-12 h-12 object-contain" />
              </button>
              {showShowroomFilters && (
                <>
                  <button
                    onClick={() => handleShowroomFilterSelect("Ropa como nueva")}
                    className={"px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap " +
                      (selectedShowroomFilter === "Ropa como nueva" ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-300')}
                  >
                    Usado como nuevo
                  </button>
                  <button
                    onClick={() => handleShowroomFilterSelect("Ropa usada")}
                    className={"px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap " +
                      (selectedShowroomFilter === "Ropa usada" ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-purple-300')}
                  >
                    Usado
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-8">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="group flex flex-col h-full bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 cursor-pointer"
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
                    <img src={product.user.avatar} className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-slate-50" alt="" />
                    <span className="text-[7px] md:text-[10px] font-bold text-slate-900 truncate max-w-[40px] md:max-w-none">{product.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] md:text-[10px] text-slate-400 flex items-center gap-1">
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
                        <Heart size={14} className="text-slate-200" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
                  <img
                    src={product.images ? product.images[0] : product.image}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={product.title}
                  />
                  {product.sold && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm uppercase tracking-widest transform -rotate-12">
                        Vendido
                      </span>
                    </div>
                  )}
                  <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3">
                    <span className="bg-white/90 backdrop-blur-sm text-black text-[6px] md:text-[9px] font-black px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-full shadow-lg uppercase border border-slate-100">
                      {product.category === 'calzado' ? ("Talle " + product.shoeSize) : ("Talle " + product.size)}
                    </span>
                  </div>
                </div>

                <div className="p-2 md:p-5 flex-1 flex flex-col">
                  <div className="mb-2 md:mb-4">
                    <div className="hidden md:flex items-center gap-1.5 mb-2">
                      <Tag size={10} className="text-[#d4af37]" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#d4af37]">{product.condition}</span>
                    </div>
                    <h3 className="text-[9px] md:text-sm font-medium text-slate-800 line-clamp-1 font-serif">{product.title}</h3>
                    {product.cuotas && (
                      <p className="text-[8px] md:text-[10px] text-emerald-600 font-bold mt-1">{product.cuotas}</p>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col border-t border-slate-50 pt-2 md:pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Precio</span>
                        <span className="text-xs md:text-xl font-black text-slate-900">{"$" + product.price.toLocaleString()}</span>
                      </div>

                      {!product.sold && product.userId !== user?.uid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 border-b md:border-b-2 border-black pb-0.5 md:pb-1 hover:text-[#d4af37] hover:border-[#d4af37] transition-all"
                        >
                          Comprar
                        </button>
                      )}

                      {product.sold && (
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1">
                          <Ban size={12} /> Vendido
                        </span>
                      )}

                      {product.userId === user?.uid && !product.sold && (
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Tu producto
                        </span>
                      )}
                    </div>

                    {/* Solo mostrar comisión al vendedor en su perfil */}
                    {user && product.userId === user.uid && (
                      <div className="mt-2 text-[8px] md:text-[10px] text-slate-500">
                        <span className="font-medium">Neto a cobrar: </span>
                        <span className="font-bold text-emerald-600">{"$" + (product.price - product.price * COMISION).toLocaleString()}</span>
                        <span className="text-[6px] md:text-[8px] ml-1">(19% comisión)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-slate-300">
            <Search size={64} className="mb-4 opacity-10" />
            <h3 className="text-xl font-serif italic">Sin resultados</h3>
            <p className="text-sm mt-2">Intentá con otros filtros de búsqueda.</p>
          </div>
        )}
      </main>

      {/* --- Modal de Recorte de Imagen --- */}
      {isCropModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCropModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Recortar imagen</h3>
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
              <span className="text-sm font-bold">Zoom:</span>
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
                className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 bg-black text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Producto --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Detalle del Producto</h2>
              <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Carrusel de imágenes */}
                <div className="relative">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
                    <img
                      src={selectedProduct.images ? selectedProduct.images[currentImageIndex] : selectedProduct.image}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                    {selectedProduct.sold && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-6 py-3 rounded-full font-bold text-xl uppercase tracking-widest transform -rotate-12">
                          Vendido
                        </span>
                      </div>
                    )}
                  </div>
                  {(selectedProduct.images?.length > 1 || (!selectedProduct.images && selectedProduct.image)) && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-all"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-lg hover:bg-white transition-all"
                      >
                        <ChevronRightIcon size={24} />
                      </button>
                    </>
                  )}
                  {/* Miniaturas */}
                  {(selectedProduct.images?.length > 1 || (!selectedProduct.images && selectedProduct.image)) && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                      {(selectedProduct.images || [selectedProduct.image]).map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={"flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all " +
                            (currentImageIndex === idx ? 'border-[#d4af37] scale-105' : 'border-transparent opacity-60 hover:opacity-100')}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Información del producto */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={selectedProduct.user.avatar}
                      alt={selectedProduct.user.name}
                      className="w-12 h-12 rounded-full cursor-pointer"
                      onClick={() => {
                        setSelectedUserProfile(selectedProduct.userId);
                        setSelectedProduct(null);
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-lg">{selectedProduct.user.name}</h3>
                      <p className="text-sm text-slate-500">{getFollowersCount(selectedProduct.userId)} seguidores</p>
                    </div>
                    {user?.isAdmin && selectedProduct.userId !== user.uid && (
                      <button
                        onClick={() => handleAdminStartChat(selectedProduct.userId, selectedProduct.id)}
                        className="ml-auto bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-all"
                        title="Iniciar chat con vendedor"
                      >
                        <MessageCircle size={18} />
                      </button>
                    )}
                  </div>

                  <h2 className="text-3xl font-bold mb-2">{selectedProduct.title}</h2>
                  <p className="text-slate-600 mb-4">{selectedProduct.description || "Sin descripción"}</p>

                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl font-black text-[#d4af37]">{"$" + selectedProduct.price.toLocaleString()}</span>
                    {selectedProduct.cuotas && (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                        {selectedProduct.cuotas}
                      </span>
                    )}
                  </div>

                  {/* Solo mostrar comisión al vendedor en su perfil */}
                  {user && selectedProduct.userId === user.uid && (
                    <div className="mb-4 text-sm bg-slate-50 p-4 rounded-xl">
                      <p className="font-bold mb-2">Detalle de la venta:</p>
                      <div className="space-y-1">
                        <p className="flex justify-between">
                          <span>Precio de venta:</span>
                          <span className="font-bold">{"$" + selectedProduct.price.toLocaleString()}</span>
                        </p>
                        <p className="flex justify-between text-red-600">
                          <span>Comisión +Roma (19%):</span>
                          <span className="font-bold">{"-$" + (selectedProduct.price * COMISION).toLocaleString()}</span>
                        </p>
                        <p className="flex justify-between text-emerald-600 border-t border-slate-200 pt-1 mt-1">
                          <span className="font-bold">Neto a cobrar:</span>
                          <span className="font-bold">{"$" + (selectedProduct.price - selectedProduct.price * COMISION).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Condición</span>
                      <p className="font-bold">{selectedProduct.condition}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Talle</span>
                      <p className="font-bold">
                        {selectedProduct.category === 'calzado' ? selectedProduct.shoeSize : selectedProduct.size}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Categoría</span>
                      <p className="font-bold">{CATEGORIES.find(c => c.id === selectedProduct.category)?.name}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Género</span>
                      <p className="font-bold">{selectedProduct.gender}</p>
                    </div>
                  </div>

                  {/* Medidas */}
                  {(selectedProduct.shoulderToShoulder || selectedProduct.armpitToArmpit || selectedProduct.length || selectedProduct.waist || selectedProduct.hip || selectedProduct.inseam || selectedProduct.outseam) && (
                    <div className="mb-6">
                      <h4 className="font-bold text-sm mb-3">Medidas (cm)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedProduct.shoulderToShoulder && (
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Hombro a hombro</span>
                            <p className="font-bold text-sm">{selectedProduct.shoulderToShoulder} cm</p>
                          </div>
                        )}
                        {selectedProduct.armpitToArmpit && (
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Axila a axila</span>
                            <p className="font-bold text-sm">{selectedProduct.armpitToArmpit} cm</p>
                          </div>
                        )}
                        {selectedProduct.length && (
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Largo</span>
                            <p className="font-bold text-sm">{selectedProduct.length} cm</p>
                          </div>
                        )}
                        {selectedProduct.waist && (
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Cintura</span>
                            <p className="font-bold text-sm">{selectedProduct.waist} cm</p>
                          </div>
                        )}
                        {selectedProduct.hip && (
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Cadera</span>
                            <p className="font-bold text-sm">{selectedProduct.hip} cm</p>
                          </div>
                        )}
                        {selectedProduct.inseam && (
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Tiro</span>
                            <p className="font-bold text-sm">{selectedProduct.inseam} cm</p>
                          </div>
                        )}
                        {selectedProduct.outseam && (
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Largo total</span>
                            <p className="font-bold text-sm">{selectedProduct.outseam} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <ThumbsUp size={20} className="text-[#d4af37]" />
                      <span className="font-bold text-lg">{selectedProduct.likes}</span>
                      <span className="text-slate-500">me gusta</span>
                    </div>
                  </div>

                  {/* Botón de comprar */}
                  {!selectedProduct.sold && selectedProduct.userId !== user?.uid && (
                    <button
                      onClick={() => addToCart(selectedProduct)}
                      className="w-full bg-black text-white py-4 rounded-2xl font-bold uppercase text-sm tracking-widest hover:bg-[#d4af37] transition-all flex items-center justify-center gap-2 mb-6"
                    >
                      <ShoppingBag size={18} /> Agregar al carrito
                    </button>
                  )}

                  {selectedProduct.sold && (
                    <div className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold uppercase text-sm tracking-widest flex items-center justify-center gap-2 mb-6">
                      <Ban size={18} /> Producto Vendido
                    </div>
                  )}

                  {selectedProduct.userId === user?.uid && !selectedProduct.sold && (
                    <div className="w-full bg-slate-200 text-slate-600 py-4 rounded-2xl font-bold uppercase text-sm tracking-widest flex items-center justify-center gap-2 mb-6">
                      <Info size={18} /> Este es tu producto
                    </div>
                  )}

                  {/* Sección de Preguntas */}
                  <div className="mb-6">
                    <h4 className="font-bold text-lg mb-4">Preguntas sobre el producto</h4>

                    {/* Formulario para hacer pregunta */}
                    {user && !selectedProduct.sold && selectedProduct.userId !== user.uid && (
                      <div className="mb-4">
                        <textarea
                          placeholder="Haz tu pregunta..."
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          className="w-full bg-slate-50 border rounded-xl p-3 text-sm h-20"
                        />
                        <button
                          onClick={() => handleAskQuestion(selectedProduct.id)}
                          className="mt-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2"
                        >
                          <Send size={14} /> Preguntar
                        </button>
                      </div>
                    )}

                    {/* Lista de preguntas */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {getProductQuestions(selectedProduct.id).map((q) => (
                        <div key={q.id} className="bg-slate-50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={q.userAvatar} alt={q.userName} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-bold">{q.userName}</span>
                            <span className="text-[8px] text-slate-400">
                              {q.createdAt?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">❓ {q.question}</p>
                          {q.answer ? (
                            <div className="bg-white p-3 rounded-lg ml-4">
                              <p className="text-sm text-green-600">✅ Respuesta: {q.answer}</p>
                              <p className="text-[8px] text-slate-400 mt-1">
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
                                      className="w-full bg-white border rounded-xl p-2 text-sm h-16"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleAnswerQuestion(q.id)}
                                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold"
                                      >
                                        Responder
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedQuestion(null);
                                          setNewAnswer("");
                                        }}
                                        className="bg-slate-300 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedQuestion(q.id)}
                                    className="text-blue-600 text-xs font-bold"
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
                        <p className="text-center text-slate-400 py-4">No hay preguntas aún</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Chat Mejorado con envío de imágenes --- */}
      {selectedChat && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedChat(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img
                  src={selectedChat.participantAvatars?.[selectedChat.participants.find(p => p !== user?.uid)] || "/icon.png"}
                  alt="Chat"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedChat.participantNames?.[selectedChat.participants.find(p => p !== user?.uid)] || "Chat"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedChat.type === 'product_review' ? `Chat sobre: ${selectedChat.productTitle}` : 'Chat directo'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedChat(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={el => setMessagesEndRef(el)}>
              {messages[selectedChat.id]?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${msg.senderId === user.uid ? 'flex-row-reverse' : ''}`}>
                    {msg.senderId !== 'system' && (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    )}
                    <div>
                      <div
                        className={`rounded-2xl p-3 ${
                          msg.senderId === 'system'
                            ? 'bg-slate-100 text-slate-600 italic'
                            : msg.senderId === user.uid
                            ? 'bg-black text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {msg.senderId === 'system' && (
                          <div className="flex items-center gap-2 mb-1">
                            <img src="/masroma.png" alt="+Roma" className="w-4 h-4" />
                            <span className="text-[8px] font-bold uppercase">Sistema</span>
                          </div>
                        )}
                        {msg.hasImage ? (
                          <div>
                            <img 
                              src={msg.image} 
                              alt="Imagen del chat" 
                              className="max-w-full max-h-48 rounded-lg cursor-pointer"
                              onClick={() => window.open(msg.image, '_blank')}
                            />
                            {msg.text !== "📷 Imagen" && <p className="mt-2 text-sm">{msg.text}</p>}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[8px] text-slate-400">
                        <span>{msg.timestamp?.toDate().toLocaleTimeString()}</span>
                        {msg.senderId === user.uid && msg.read && (
                          <span className="text-green-600">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t">
              {newImageMessage && (
                <div className="mb-4 relative inline-block">
                  <img 
                    src={newImageMessage} 
                    alt="Preview" 
                    className="max-h-24 rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setNewImageMessage(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleChatImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-100 text-slate-600 p-3 rounded-full hover:bg-slate-200 transition-all"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && (newMessage.trim() || newImageMessage)) {
                      handleSendMessage(selectedChat.id);
                    }
                  }}
                  className="flex-1 bg-slate-50 border rounded-full py-3 px-6 text-sm outline-none focus:ring-1 focus:ring-[#d4af37]"
                />
                <button
                  onClick={() => handleSendMessage(selectedChat.id)}
                  disabled={!newMessage.trim() && !newImageMessage}
                  className={`p-3 rounded-full transition-all ${
                    newMessage.trim() || newImageMessage 
                      ? 'bg-black text-white hover:bg-[#d4af37]' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Perfil de Usuario --- */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUserProfile(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Perfil de {users[selectedUserProfile]?.name}</h2>
              <button onClick={() => setSelectedUserProfile(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {/* Cover y Avatar */}
              <div className="relative mb-16">
                <div className="h-48 rounded-2xl overflow-hidden">
                  <img
                    src={users[selectedUserProfile]?.coverImage || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=1200"}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-12 left-6">
                  <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white">
                    <img
                      src={users[selectedUserProfile]?.avatar}
                      alt={users[selectedUserProfile]?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Info del usuario */}
              <div className="mt-8">
                <h3 className="text-2xl font-bold">{users[selectedUserProfile]?.name}</h3>
                <p className="text-slate-500 mt-1">{users[selectedUserProfile]?.bio || "Sin biografía"}</p>
                {users[selectedUserProfile]?.canPublish && (
                  <span className="inline-block mt-2 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full">
                    Vendedor autorizado
                  </span>
                )}
                
                {/* Total ganado (solo visible para el propio usuario) */}
                {user && user.uid === selectedUserProfile && (
                  <div className="mt-4 bg-emerald-50 p-4 rounded-2xl">
                    <p className="text-sm text-emerald-700 mb-1 flex items-center gap-2">
                      <DollarSign size={16} />
                      <span className="font-bold">Total ganado (neto):</span>
                    </p>
                    <p className="text-2xl font-black text-emerald-600">
                      {"$" + (users[selectedUserProfile]?.totalEarned || 0).toLocaleString()}
                    </p>
                    <p className="text-[8px] text-emerald-500 mt-1">
                      *Después de comisión del 19%
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  {user && user.uid !== selectedUserProfile && (
                    <button
                      onClick={() => handleFollow(selectedUserProfile)}
                      className={"px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all " +
                        (isFollowing(selectedUserProfile) ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#d4af37] text-white hover:bg-black')}
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

              {/* Pestañas */}
              <div className="flex gap-4 mt-8 border-b overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectedTab('publicaciones')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'publicaciones' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600')}
                >
                  Publicaciones ({getUserProducts(selectedUserProfile).filter(p => !p.sold && p.status.publicada).length})
                </button>
                <button
                  onClick={() => setSelectedTab('pendientes')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'pendientes' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600')}
                >
                  Pendientes ({getUserProducts(selectedUserProfile).filter(p => !p.status.publicada).length})
                </button>
                <button
                  onClick={() => setSelectedTab('vendidos')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'vendidos' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600')}
                >
                  Vendidos ({getUserProducts(selectedUserProfile).filter(p => p.sold).length})
                </button>
                <button
                  onClick={() => setSelectedTab('preguntas')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'preguntas' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600')}
                >
                  Preguntas ({getUserQuestions(selectedUserProfile).filter(q => !q.answer).length})
                </button>
                <button
                  onClick={() => setSelectedTab('seguidores')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'seguidores' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600')}
                >
                  Seguidores ({getFollowersCount(selectedUserProfile)})
                </button>
                <button
                  onClick={() => setSelectedTab('siguiendo')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'siguiendo' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600')}
                >
                  Siguiendo ({getFollowingCount(selectedUserProfile)})
                </button>
                <button
                  onClick={() => setSelectedTab('likes')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'likes' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600')}
                >
                  Likes recibidos ({getLikesReceived(selectedUserProfile)})
                </button>
                <button
                  onClick={() => setSelectedTab('chats')}
                  className={"px-4 py-2 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all " +
                    (selectedTab === 'chats' ? 'text-black border-b-2 border-black' : 'text-slate-400 hover:text-slate-600')}
                >
                  Chats ({chats.filter(chat => chat.participants.includes(selectedUserProfile)).length})
                </button>
              </div>

              {/* Contenido de las pestañas */}
              <div className="mt-6">
                {selectedTab === 'publicaciones' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getUserProducts(selectedUserProfile).filter(p => !p.sold && p.status.publicada).map(product => (
                      <div
                        key={product.id}
                        className="border rounded-xl overflow-hidden cursor-pointer"
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
                          <p className="font-bold text-sm truncate">{product.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{"$" + product.price.toLocaleString()}</p>
                          {/* Estado de la publicación */}
                          <div className="mt-2 flex items-center gap-1 text-[8px]">
                            <div className={"w-1.5 h-1.5 rounded-full " + (product.status.iniciada ? 'bg-green-500' : 'bg-slate-200')}></div>
                            <div className={"w-1.5 h-1.5 rounded-full " + (product.status.verificada ? 'bg-green-500' : 'bg-slate-200')}></div>
                            <div className={"w-1.5 h-1.5 rounded-full " + (product.status.aprobada ? 'bg-green-500' : 'bg-slate-200')}></div>
                            <div className={"w-1.5 h-1.5 rounded-full " + (product.status.publicada ? 'bg-green-500' : 'bg-slate-200')}></div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[8px] text-slate-400 flex items-center gap-1">
                              <ThumbsUp size={8} /> {product.likes}
                            </span>
                            {user?.uid === selectedUserProfile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProduct(product);
                                }}
                                className="text-[8px] text-blue-600 hover:text-blue-800"
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
                        className="border rounded-xl overflow-hidden cursor-pointer opacity-75"
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
                          <p className="font-bold text-sm truncate">{product.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{"$" + product.price.toLocaleString()}</p>
                          <p className="text-[8px] text-yellow-600 mt-1">En revisión</p>
                          {user?.uid === selectedUserProfile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProduct(product);
                              }}
                              className="mt-2 text-[8px] text-blue-600 hover:text-blue-800"
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
                      <div key={product.id} className="border rounded-xl overflow-hidden opacity-75">
                        <div className="relative">
                          <img
                            src={product.images ? product.images[0] : product.image}
                            alt={product.title}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">VENDIDO</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-sm truncate">{product.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{"$" + product.price.toLocaleString()}</p>
                          <p className="text-[8px] text-slate-400 mt-1">Vendido</p>
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
                        <div key={q.id} className="bg-slate-50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={q.userAvatar} alt={q.userName} className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-bold">{q.userName}</span>
                            <span className="text-[8px] text-slate-400">
                              {q.createdAt?.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">❓ {q.question}</p>
                          {product && (
                            <div className="text-xs text-slate-500 mb-2">
                              Sobre: {product.title}
                            </div>
                          )}
                          {q.answer ? (
                            <div className="bg-white p-3 rounded-lg ml-4">
                              <p className="text-sm text-green-600">✅ Respuesta: {q.answer}</p>
                              <p className="text-[8px] text-slate-400 mt-1">
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
                                      className="w-full bg-white border rounded-xl p-2 text-sm h-16"
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleAnswerQuestion(q.id)}
                                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold"
                                      >
                                        Responder
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedQuestion(null);
                                          setNewAnswer("");
                                        }}
                                        className="bg-slate-300 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setSelectedQuestion(q.id)}
                                    className="text-blue-600 text-xs font-bold"
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
                      <p className="text-center text-slate-400 py-8">No hay preguntas aún</p>
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
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100"
                          onClick={() => setSelectedUserProfile(followerId)}
                        >
                          <img src={follower.avatar} alt={follower.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="font-bold">{follower.name}</p>
                            <p className="text-xs text-slate-500">{follower.email}</p>
                          </div>
                        </div>
                      ) : null;
                    })}
                    {(!followers[selectedUserProfile] || followers[selectedUserProfile].length === 0) && (
                      <p className="text-center text-slate-400 py-8">No tiene seguidores aún</p>
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
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100"
                          onClick={() => setSelectedUserProfile(followingId)}
                        >
                          <img src={followingUser.avatar} alt={followingUser.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="font-bold">{followingUser.name}</p>
                            <p className="text-xs text-slate-500">{followingUser.email}</p>
                          </div>
                        </div>
                      ) : null;
                    })}
                    {(!following[selectedUserProfile] || following[selectedUserProfile].length === 0) && (
                      <p className="text-center text-slate-400 py-8">No sigue a nadie aún</p>
                    )}
                  </div>
                )}

                {selectedTab === 'likes' && (
                  <div className="space-y-2">
                    {products
                      .filter(p => p.userId === selectedUserProfile && p.likedBy && p.likedBy.length > 0)
                      .map(product => (
                        <div key={product.id} className="p-4 bg-slate-50 rounded-xl">
                          <p className="font-bold mb-2">{product.title} - {product.likes} likes</p>
                          <div className="flex flex-wrap gap-2">
                            {product.likedBy?.map(likerId => {
                              const liker = users[likerId];
                              return liker ? (
                                <div
                                  key={likerId}
                                  className="flex items-center gap-2 bg-white p-2 rounded-lg cursor-pointer"
                                  onClick={() => setSelectedUserProfile(likerId)}
                                >
                                  <img src={liker.avatar} alt={liker.name} className="w-6 h-6 rounded-full" />
                                  <span className="text-xs">{liker.name}</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      ))}
                    {products.filter(p => p.userId === selectedUserProfile && p.likedBy && p.likedBy.length > 0).length === 0 && (
                      <p className="text-center text-slate-400 py-8">Aún no ha recibido likes</p>
                    )}
                  </div>
                )}

                {selectedTab === 'chats' && (
                  <div className="space-y-2">
                    {chats
                      .filter(chat => chat.participants.includes(selectedUserProfile))
                      .map(chat => {
                        const otherParticipantId = chat.participants.find(p => p !== selectedUserProfile);
                        const otherUser = users[otherParticipantId];
                        const isAdmin = otherUser?.isAdmin;
                        
                        return (
                          <div
                            key={chat.id}
                            className="p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all"
                            onClick={() => {
                              setSelectedChat(chat);
                              setSelectedUserProfile(null);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={chat.participantAvatars?.[otherParticipantId] || (isAdmin ? "/icon.png" : otherUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + otherParticipantId)}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold">
                                    {chat.participantNames?.[otherParticipantId] || (isAdmin ? "Administración" : otherUser?.name || "Usuario")}
                                  </h4>
                                  <span className="text-[8px] text-slate-400">
                                    {chat.lastMessageAt?.toDate().toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-1">{chat.lastMessage}</p>
                                {chat.unreadCount?.[selectedUserProfile] > 0 && (
                                  <span className="mt-1 inline-block bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded-full">
                                    {chat.unreadCount[selectedUserProfile]} mensajes nuevos
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {chats.filter(chat => chat.participants.includes(selectedUserProfile)).length === 0 && (
                      <p className="text-center text-slate-400 py-8">No hay chats aún</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Gestión de Usuarios Autorizados (Solo Admin Principal) --- */}
      {isAuthorizedUsersModalOpen && user?.isMainAdmin && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAuthorizedUsersModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Lock size={24} className="text-[#d4af37]" />
                Gestionar Vendedores Autorizados
              </h2>
              <button onClick={() => setIsAuthorizedUsersModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-4">
                Estos usuarios pueden publicar productos en la plataforma.
              </p>
              
              <div className="flex gap-2 mb-6">
                <input
                  type="email"
                  placeholder="Email del nuevo vendedor"
                  value={newAuthorizedEmail}
                  onChange={(e) => setNewAuthorizedEmail(e.target.value)}
                  className="flex-1 bg-slate-50 border rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-[#d4af37]"
                />
                <button
                  onClick={handleAddAuthorizedUser}
                  className="bg-black text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#d4af37] transition-all"
                >
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm mb-3">Vendedores actuales:</h3>
                {authorizedSellers.map(email => (
                  <div key={email} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check size={16} className="text-green-600" />
                      </div>
                      <span className="font-medium">{email}</span>
                      {email === MAIN_ADMIN_EMAIL && (
                        <span className="text-[8px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          Admin Principal
                        </span>
                      )}
                    </div>
                    {email !== MAIN_ADMIN_EMAIL && (
                      <button
                        onClick={() => handleRemoveAuthorizedUser(email)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
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
              className="w-full bg-slate-200 text-slate-700 py-4 rounded-xl font-bold text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* --- Modal de Edición de Perfil --- */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditProfileOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Editar Perfil</h3>
              <button onClick={() => setIsEditProfileOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Nombre</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full bg-slate-50 border rounded-xl p-3 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Biografía</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  className="w-full bg-slate-50 border rounded-xl p-3 outline-none h-24"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">WhatsApp (para notificaciones)</label>
                <input
                  type="tel"
                  placeholder="Ej: 5491124689196"
                  value={profileData.whatsappNumber}
                  onChange={(e) => setProfileData({...profileData, whatsappNumber: e.target.value})}
                  className="w-full bg-slate-50 border rounded-xl p-3 outline-none"
                />
                <p className="text-[8px] text-slate-400 mt-1">Recibirás notificaciones cuando vendas un producto</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Foto de perfil</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden">
                    <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <label className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase cursor-pointer">
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
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Foto de portada</label>
                <div className="space-y-2">
                  <div className="h-24 rounded-xl bg-slate-100 overflow-hidden">
                    <img src={profileData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                  <label className="inline-block bg-black text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase cursor-pointer">
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
                className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest mt-4"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsQuestionsOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Preguntas recibidas</h3>
              <button onClick={() => setIsQuestionsOpen(false)}><X size={24} /></button>
            </div>
            <div className="space-y-4">
              {getUserQuestions(user?.uid).map((q) => {
                const product = [...products, ...pendingProducts].find(p => p.id === q.productId);
                return (
                  <div key={q.id} className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={q.userAvatar} alt={q.userName} className="w-6 h-6 rounded-full" />
                      <span className="text-xs font-bold">{q.userName}</span>
                      <span className="text-[8px] text-slate-400">
                        {q.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">❓ {q.question}</p>
                    {product && (
                      <div className="text-xs text-slate-500 mb-2">
                        Sobre: <span className="font-bold">{product.title}</span>
                      </div>
                    )}
                    {q.answer ? (
                      <div className="bg-white p-3 rounded-lg ml-4">
                        <p className="text-sm text-green-600">✅ Respuesta: {q.answer}</p>
                        <p className="text-[8px] text-slate-400 mt-1">
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
                              className="w-full bg-white border rounded-xl p-2 text-sm h-16"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleAnswerQuestion(q.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold"
                              >
                                Responder
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedQuestion(null);
                                  setNewAnswer("");
                                }}
                                className="bg-slate-300 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedQuestion(q.id)}
                            className="text-blue-600 text-xs font-bold"
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
                <p className="text-center text-slate-400 py-8">No tienes preguntas pendientes</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Modal PIN (Oculto) --- */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPinModal(false)}></div>
          <div className="relative bg-white p-8 rounded-3xl w-full max-w-xs text-center shadow-2xl">
            <Lock className="mx-auto mb-4 text-[#d4af37]" size={32} />
            <h3 className="font-bold mb-4">Acceso Editor</h3>
            <input
              type="password"
              placeholder="PIN"
              className="w-full bg-slate-100 rounded-xl py-3 px-5 text-center text-xl tracking-widest mb-4 outline-none border focus:border-[#d4af37]"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            <button
              onClick={handlePinSubmit}
              className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {/* --- Modal Admin SALE! y Gestión de Publicaciones --- */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAdminModal(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold italic flex items-center gap-2 tracking-tighter"><Edit3 /> Panel de Administración</h2>
              <button onClick={() => setShowAdminModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>

            {/* Configuración del Banner */}
            <div className="mb-12 p-6 bg-slate-50 rounded-3xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Tag size={18} /> Editar Banner SALE!</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Título del Banner</label>
                  <input
                    className="w-full bg-white border p-4 rounded-2xl outline-none focus:border-black"
                    value={saleConfig.title}
                    onChange={(e) => setSaleConfig({...saleConfig, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Precio/Promo (Ej: 50% OFF)</label>
                  <input
                    className="w-full bg-white border p-4 rounded-2xl outline-none focus:border-black"
                    value={saleConfig.promo}
                    onChange={(e) => setSaleConfig({...saleConfig, promo: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Vigencia/Texto adicional</label>
                  <input
                    className="w-full bg-white border p-4 rounded-2xl outline-none focus:border-black"
                    value={saleConfig.vigencia}
                    onChange={(e) => setSaleConfig({...saleConfig, vigencia: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={saleConfig.active}
                    onChange={(e) => setSaleConfig({...saleConfig, active: e.target.checked})}
                    className="w-5 h-5 accent-black"
                  />
                  <span className="text-sm font-bold">Banner Activo</span>
                </div>
              </div>
            </div>

            {/* Pestañas para publicaciones */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => setSelectedTab('pendientes')}
                className={"px-4 py-2 text-sm font-bold uppercase tracking-widest " +
                  (selectedTab === 'pendientes' ? 'text-black border-b-2 border-black' : 'text-slate-400')}
              >
                Pendientes ({pendingProducts.length})
              </button>
              <button
                onClick={() => setSelectedTab('publicadas')}
                className={"px-4 py-2 text-sm font-bold uppercase tracking-widest " +
                  (selectedTab === 'publicadas' ? 'text-black border-b-2 border-black' : 'text-slate-400')}
              >
                Publicadas ({products.length})
              </button>
              <button
                onClick={() => setSelectedTab('vendidas')}
                className={"px-4 py-2 text-sm font-bold uppercase tracking-widest " +
                  (selectedTab === 'vendidas' ? 'text-black border-b-2 border-black' : 'text-slate-400')}
              >
                Vendidas ({[...products, ...pendingProducts].filter(p => p.sold).length})
              </button>
            </div>

            {/* Gestión de Publicaciones */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock size={18} /> {selectedTab === 'pendientes' ? 'Publicaciones Pendientes' : selectedTab === 'publicadas' ? 'Publicaciones Publicadas' : 'Publicaciones Vendidas'}
              </h3>
              <div className="space-y-6">
                {(selectedTab === 'pendientes' ? pendingProducts : selectedTab === 'publicadas' ? products : [...products, ...pendingProducts].filter(p => p.sold)).map(product => (
                  <div key={product.id} className="border rounded-3xl p-6 bg-gradient-to-r from-slate-50 to-white shadow-lg hover:shadow-xl transition-all">
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
                          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                            <span className="text-white font-bold text-xs rotate-12">VENDIDO</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-xl mb-1">{product.title}</h4>
                            <div className="flex items-center gap-2">
                              <img src={product.user.avatar} alt={product.user.name} className="w-5 h-5 rounded-full" />
                              <p className="text-sm text-slate-600">{product.user.name}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {selectedTab === 'pendientes' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(product.id, 'verificada')}
                                  className={"p-3 rounded-xl transition-all transform hover:scale-105 " +
                                    (product.status.verificada ? 'bg-green-100 text-green-600 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-green-50 hover:text-green-500')}
                                  title="Verificar"
                                >
                                  <CheckCircle size={22} />
                                </button>
                                <button
                                  onClick={() => handleStatusChange(product.id, 'aprobada')}
                                  className={"p-3 rounded-xl transition-all transform hover:scale-105 " +
                                    (product.status.aprobada ? 'bg-green-100 text-green-600 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-green-50 hover:text-green-500')}
                                  title="Aprobar"
                                >
                                  <Check size={22} />
                                </button>
                                <button
                                  onClick={() => handlePublishProduct(product.id)}
                                  className="p-3 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all transform hover:scale-105"
                                  title="Publicar"
                                >
                                  <ArrowRight size={22} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-all transform hover:scale-105"
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

                        {/* Progreso de publicación */}
                        {!product.sold && (
                          <div className="mt-4 bg-slate-100 p-4 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 flex-1">
                                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " +
                                  (product.status.iniciada ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-slate-300')}>
                                  {product.status.iniciada ? <Check size={16} /> : '1'}
                                </div>
                                <div className={"flex-1 h-1 " + (product.status.verificada ? 'bg-green-500' : 'bg-slate-300')}></div>
                                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " +
                                  (product.status.verificada ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-slate-300')}>
                                  {product.status.verificada ? <Check size={16} /> : '2'}
                                </div>
                                <div className={"flex-1 h-1 " + (product.status.aprobada ? 'bg-green-500' : 'bg-slate-300')}></div>
                                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " +
                                  (product.status.aprobada ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-slate-300')}>
                                  {product.status.aprobada ? <Check size={16} /> : '3'}
                                </div>
                                <div className={"flex-1 h-1 " + (product.status.publicada ? 'bg-green-500' : 'bg-slate-300')}></div>
                                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " +
                                  (product.status.publicada ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-slate-400 border-2 border-slate-300')}>
                                  {product.status.publicada ? <Check size={16} /> : '4'}
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between mt-2 px-1">
                              <span className="text-[10px] font-bold text-slate-500">Iniciada</span>
                              <span className="text-[10px] font-bold text-slate-500">Verificada</span>
                              <span className="text-[10px] font-bold text-slate-500">Aprobada</span>
                              <span className="text-[10px] font-bold text-slate-500">Publicada</span>
                            </div>
                          </div>
                        )}

                        {/* Detalles del producto con comisión */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Precio</span>
                            <p className="font-black text-sm">{"$" + product.price.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Comisión</span>
                            <p className="font-bold text-sm text-red-600">{"$" + (product.price * COMISION).toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[8px] font-bold uppercase text-slate-400">Neto vendedor</span>
                            <p className="font-bold text-sm text-emerald-600">{"$" + (product.price - product.price * COMISION).toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[8px] font-bold uppercase text-slate-400">
                              {product.category === 'calzado' ? 'Talle (EUR)' : 'Talle'}
                            </span>
                            <p className="font-bold text-sm">
                              {product.category === 'calzado' ? product.shoeSize : product.size}
                            </p>
                          </div>
                        </div>

                        {/* WhatsApp del vendedor (visible solo para admin) */}
                        {product.whatsappNumber && (
                          <div className="mt-3 bg-blue-50 p-2 rounded-xl flex items-center gap-2">
                            <Phone size={14} className="text-blue-600" />
                            <span className="text-xs text-blue-600">WhatsApp: {product.whatsappNumber}</span>
                          </div>
                        )}

                        {/* Botón para iniciar chat con vendedor */}
                        {user?.isAdmin && !product.sold && (
                          <button
                            onClick={() => handleAdminStartChat(product.userId, product.id)}
                            className="mt-3 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-green-700 transition-all"
                          >
                            <MessageCircle size={14} /> Iniciar chat con vendedor
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Sección de Chats con Usuarios (Admin) --- */}
            <div className="mt-12">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageCircle size={18} /> Chats con Usuarios
              </h3>
              
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar usuario por nombre o email..."
                    className="w-full bg-slate-50 border rounded-2xl py-4 px-12 outline-none focus:ring-1 focus:ring-[#d4af37]"
                    value={searchUserTerm}
                    onChange={(e) => setSearchUserTerm(e.target.value)}
                  />
                  <Search className="absolute left-4 top-4 text-slate-400" size={20} />
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
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={userItem.avatar}
                            alt={userItem.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-bold">{userItem.name}</h4>
                            <p className="text-xs text-slate-500">{userItem.email}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            handleAdminStartDirectChat(userItem);
                            setShowAdminModal(false);
                          }}
                          className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#d4af37] transition-all"
                        >
                          <MessageCircle size={14} />
                          Iniciar chat
                        </button>
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBuyersPanelOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Users /> Compradores y Comprobantes</h2>
              <button onClick={() => setIsBuyersPanelOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>

            {selectedReceipt ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-black"
                >
                  <ChevronLeft size={18} /> Volver a la lista
                </button>
                
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <img src={selectedReceipt.userAvatar} alt={selectedReceipt.userName} className="w-16 h-16 rounded-full" />
                    <div>
                      <h3 className="text-xl font-bold">{selectedReceipt.userName}</h3>
                      <p className="text-sm text-slate-500">Comprado el {selectedReceipt.createdAt?.toDate().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold mb-2">Productos comprados:</h4>
                    <div className="space-y-2">
                      {selectedReceipt.cart?.map((item, index) => (
                        <div key={index} className="bg-white p-3 rounded-xl flex justify-between">
                          <span>{item.title} (Talle: {item.size})</span>
                          <span className="font-bold">${item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-right">
                      <span className="text-lg font-bold">Total: ${selectedReceipt.total?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold mb-2">Comprobante:</h4>
                    <div className="relative bg-white p-4 rounded-2xl overflow-auto max-h-96">
                      <div className="sticky top-0 bg-white z-10 flex justify-end gap-2 p-2">
                        <button
                          onClick={() => setReceiptZoom(prev => Math.min(prev + 0.5, 3))}
                          className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                        >
                          <ZoomIn size={18} />
                        </button>
                        <button
                          onClick={() => setReceiptZoom(prev => Math.max(prev - 0.5, 0.5))}
                          className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                        >
                          <Maximize2 size={18} />
                        </button>
                        <button
                          onClick={() => downloadReceipt(selectedReceipt.receipt, selectedReceipt.receiptName)}
                          className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
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
                      className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-sm"
                    >
                      Marcar como procesado
                    </button>
                    <button
                      onClick={() => {
                        const buyerId = selectedReceipt.userId;
                        const productId = selectedReceipt.cart[0].id;
                        handleAdminStartChat(buyerId, productId);
                        setIsBuyersPanelOpen(false);
                      }}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} /> Chatear con comprador
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {receipts.map(receipt => (
                  <div
                    key={receipt.id}
                    className={`border rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all ${!receipt.processed ? 'bg-yellow-50' : ''}`}
                    onClick={() => setSelectedReceipt(receipt)}
                  >
                    <div className="flex items-center gap-4">
                      <img src={receipt.userAvatar} alt={receipt.userName} className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{receipt.userName}</h3>
                            <p className="text-sm text-slate-500">{receipt.cart?.length} productos</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${receipt.total?.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400">{receipt.createdAt?.toDate().toLocaleString()}</p>
                          </div>
                        </div>
                        {!receipt.processed && (
                          <span className="mt-2 inline-block bg-yellow-200 text-yellow-800 text-[8px] font-bold px-2 py-1 rounded-full">
                            Pendiente de procesar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {receipts.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsEditProductOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-bold tracking-tight">Editar Publicación</h3>
                <button onClick={() => setIsEditProductOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleUpdateProduct} className="space-y-6">
                {/* Imágenes del producto */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Imágenes del producto (máx. 5)</label>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {(editingProduct.images || [editingProduct.image]).map((img, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-xl bg-slate-100 overflow-hidden group">
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
                      <label className="w-24 h-24 rounded-xl bg-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                        <Camera size={24} className="text-slate-400" />
                        <span className="text-[8px] text-slate-400 mt-1">Agregar</span>
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
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                  required
                />

                <textarea
                  placeholder="Descripción del producto"
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none h-24"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                />

                <input
                  type="number"
                  placeholder="Precio ($)"
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                  required
                />

                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-sm text-slate-600 mb-2">
                    <span className="font-bold">Comisión +Roma (19%):</span> {"$" + (editingProduct.price * COMISION).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-bold">Neto a cobrar:</span> {"$" + (editingProduct.price - editingProduct.price * COMISION).toLocaleString()}
                  </p>
                </div>

                <input
                  type="number"
                  placeholder="Cuotas sin interés (solo número, ej: 12)"
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none"
                  value={editingProduct.cuotas ? editingProduct.cuotas.replace(/\D/g, '') : ''}
                  onChange={(e) => setEditingProduct({...editingProduct, cuotas: e.target.value})}
                />

                <input
                  type="tel"
                  placeholder="WhatsApp para notificaciones"
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none"
                  value={editingProduct.whatsappNumber || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, whatsappNumber: e.target.value})}
                />

                <div className="grid grid-cols-2 gap-4">
                  {editingProduct.category === 'calzado' ? (
                    <select
                      className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                      value={editingProduct.shoeSize}
                      onChange={(e) => setEditingProduct({...editingProduct, shoeSize: e.target.value})}
                    >
                      {SHOE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <select
                      className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                      value={editingProduct.size}
                      onChange={(e) => setEditingProduct({...editingProduct, size: e.target.value})}
                    >
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  <select
                    className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                    value={editingProduct.category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      setEditingProduct({...editingProduct, category: newCategory});
                    }}
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Medidas para parte superior */}
                {(editingProduct.category === 'remeras' || editingProduct.category === 'camisas' || editingProduct.category === 'buzos' || editingProduct.category === 'vestidos' || editingProduct.category === 'camperas') && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm">Medidas parte superior (cm)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Hombro a hombro"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={editingProduct.shoulderToShoulder || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, shoulderToShoulder: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Axila a axila"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={editingProduct.armpitToArmpit || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, armpitToArmpit: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Largo"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={editingProduct.length || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, length: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Medidas para parte inferior */}
                {(editingProduct.category === 'pantalones' || editingProduct.category === 'jeans' || editingProduct.category === 'short') && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm">Medidas parte inferior (cm)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Cintura"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={editingProduct.waist || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, waist: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Cadera"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={editingProduct.hip || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, hip: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Tiro"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={editingProduct.inseam || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, inseam: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Largo total"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={editingProduct.outseam || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, outseam: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                    value={editingProduct.condition}
                    onChange={(e) => setEditingProduct({...editingProduct, condition: e.target.value})}
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                    value={editingProduct.gender}
                    onChange={(e) => setEditingProduct({...editingProduct, gender: e.target.value})}
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <select
                  className="w-full bg-slate-50 border rounded-2xl p-3.5 outline-none"
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
                    className="flex-1 bg-black text-white py-5 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest"
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="hidden md:block w-1/3 bg-[#d4af37] p-10 text-white flex flex-col justify-between">
              <div>
                <h2 className="text-4xl font-serif italic mb-2">+Roma</h2>
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
                <h3 className="text-xl font-bold tracking-tight">Vende tu Prenda</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleUpload} className="space-y-6">
                {/* Imágenes del producto con Drag & Drop */}
                <DraggableImageUploader
                  images={newProduct.images}
                  onImagesChange={(images) => setNewProduct({...newProduct, images})}
                  maxImages={5}
                />

                <input
                  type="text"
                  placeholder="Título *"
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                  required
                />

                <textarea
                  placeholder="Descripción del producto"
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none h-24"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />

                <input
                  type="number"
                  placeholder="Precio ($) *"
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  required
                />

                {newProduct.price && (
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-sm text-slate-600 mb-1">
                      <span className="font-bold">Comisión +Roma (19%):</span> {"$" + (parseInt(newProduct.price) * COMISION).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-bold">Neto a cobrar:</span> {"$" + (parseInt(newProduct.price) - parseInt(newProduct.price) * COMISION).toLocaleString()}
                    </p>
                  </div>
                )}

                <input
                  type="number"
                  placeholder="Cuotas sin interés (solo número, ej: 12)"
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none"
                  value={newProduct.cuotas}
                  onChange={(e) => setNewProduct({...newProduct, cuotas: e.target.value})}
                />

                <input
                  type="tel"
                  placeholder="WhatsApp para notificaciones de venta *"
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none"
                  value={newProduct.whatsappNumber}
                  onChange={(e) => setNewProduct({...newProduct, whatsappNumber: e.target.value})}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  {newProduct.category === 'calzado' ? (
                    <select
                      className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                      value={newProduct.shoeSize}
                      onChange={(e) => setNewProduct({...newProduct, shoeSize: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar talle *</option>
                      {SHOE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <select
                      className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                      value={newProduct.size}
                      onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}
                      required
                    >
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  <select
                    className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                    value={newProduct.category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      setNewProduct({...newProduct, category: newCategory});
                    }}
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Medidas para parte superior */}
                {(newProduct.category === 'remeras' || newProduct.category === 'camisas' || newProduct.category === 'buzos' || newProduct.category === 'vestidos' || newProduct.category === 'camperas') && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm">Medidas parte superior (cm)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Hombro a hombro"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={newProduct.shoulderToShoulder}
                        onChange={(e) => setNewProduct({...newProduct, shoulderToShoulder: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Axila a axila"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={newProduct.armpitToArmpit}
                        onChange={(e) => setNewProduct({...newProduct, armpitToArmpit: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Largo"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={newProduct.length}
                        onChange={(e) => setNewProduct({...newProduct, length: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Medidas para parte inferior */}
                {(newProduct.category === 'pantalones' || newProduct.category === 'jeans' || newProduct.category === 'short') && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm">Medidas parte inferior (cm)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Cintura"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={newProduct.waist}
                        onChange={(e) => setNewProduct({...newProduct, waist: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Cadera"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={newProduct.hip}
                        onChange={(e) => setNewProduct({...newProduct, hip: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Tiro"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={newProduct.inseam}
                        onChange={(e) => setNewProduct({...newProduct, inseam: e.target.value})}
                      />
                      <input
                        type="number"
                        placeholder="Largo total"
                        className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                        value={newProduct.outseam}
                        onChange={(e) => setNewProduct({...newProduct, outseam: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <select
                    className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                    value={newProduct.condition}
                    onChange={(e) => setNewProduct({...newProduct, condition: e.target.value})}
                  >
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                    value={newProduct.gender}
                    onChange={(e) => setNewProduct({...newProduct, gender: e.target.value})}
                  >
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <select
                  className="w-full bg-slate-50 border rounded-2xl p-3.5 outline-none"
                  value={newProduct.ageGroup}
                  onChange={(e) => setNewProduct({...newProduct, ageGroup: e.target.value})}
                >
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>

                <div className="bg-blue-50 p-4 rounded-2xl">
                  <p className="text-xs text-blue-600 font-bold mb-2">Progreso de publicación:</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                        <Check size={12} />
                      </div>
                      <span className="text-[8px]">Iniciada</span>
                    </div>
                    <div className="w-4 h-[2px] bg-slate-200"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px]">2</div>
                      <span className="text-[8px]">Verificada</span>
                    </div>
                    <div className="w-4 h-[2px] bg-slate-200"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px]">3</div>
                      <span className="text-[8px]">Aprobada</span>
                    </div>
                    <div className="w-4 h-[2px] bg-slate-200"></div>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px]">4</div>
                      <span className="text-[8px]">Publicada</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-5 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest mt-4"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Elegí cómo pagar</h3>
              <button onClick={() => setIsPaymentModalOpen(false)}><X size={24} /></button>
            </div>

            <div className="space-y-4">
              {/* Botón MercadoPago */}
              <button
                onClick={() => {
                  setSelectedPaymentMethod('mercadopago');
                  handlePayment();
                }}
                className="w-full bg-blue-600 text-white p-6 rounded-2xl font-bold text-lg flex items-center justify-between hover:bg-blue-700 transition-all"
              >
                <span>MercadoPago</span>
                <CreditCard size={24} />
              </button>

              {/* Botón Transferencia */}
              <div className="relative">
                <button
                  onClick={() => {
                    console.log("💰 Click en Transferencia Bancaria");
                    setSelectedPaymentMethod('transferencia');
                    setIsPaymentModalOpen(false);
                    setIsReceiptModalOpen(true);
                  }}
                  className="w-full bg-green-600 text-white p-6 rounded-2xl font-bold text-lg flex items-center justify-between hover:bg-green-700 transition-all"
                >
                  <div className="text-left">
                    <span>Transferencia Bancaria</span>
                    <p className="text-xs opacity-90 mt-1">5% OFF - Ahorrá ${(cartTotal * 0.05).toLocaleString()}</p>
                  </div>
                  <DollarSign size={24} />
                </button>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold px-2 py-1 rounded-full animate-pulse">
                  5% OFF
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 mt-6">
              Total a pagar: <span className="font-bold">${cartTotal.toLocaleString()}</span>
            </p>
          </div>
        </div>
      )}

      {/* --- Modal de Carga de Comprobante (Transferencia) --- */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReceiptModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Datos para transferencia</h3>
              <button onClick={() => setIsReceiptModalOpen(false)}><X size={24} /></button>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl mb-6">
              <p className="text-sm font-bold mb-4">💰 Beneficio: 5% OFF</p>
              <p className="text-xs mb-1"><span className="font-bold">Alias:</span> show.masroma</p>
              <p className="text-xs mb-1"><span className="font-bold">CBU:</span> 4530000800015997551907</p>
              <p className="text-xs mb-1"><span className="font-bold">Caja de ahorro en pesos:</span> 1599755190</p>
              <p className="text-xs mb-1"><span className="font-bold">Titular:</span> Romina Mariela Arena</p>
              <p className="text-xs mb-1"><span className="font-bold">CUIL:</span> 27344003799</p>
              <p className="text-xs"><span className="font-bold">Banco:</span> Naranja X</p>
              
              <div className="mt-4 p-3 bg-yellow-100 rounded-xl">
                <p className="text-xs font-bold text-yellow-800">Total con descuento:</p>
                <p className="text-2xl font-black text-green-600">${cartTotalWithDiscount.toLocaleString()}</p>
                <p className="text-[8px] text-slate-500">(Ahorrás ${(cartTotal * 0.05).toLocaleString()})</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-bold mb-2">Subí tu comprobante</p>
                <p className="text-[10px] text-slate-400 mb-4">Formatos: JPG, PNG (máx. 5MB)</p>
                <label className="inline-block bg-black text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase cursor-pointer">
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
                  // Simular pago con transferencia (sin comprobante)
                  for (let i = 0; i < cart.length; i++) {
                    const item = cart[i];
                    handleMarkAsSold(item.id, user.uid, 'transferencia');
                  }
                  setCart([]);
                  setIsReceiptModalOpen(false);
                  alert("¡Gracias por tu compra! El administrador se comunicará contigo para coordinar la entrega.");
                }}
                className="w-full text-[10px] text-slate-400 underline mt-2"
              >
                Ya realicé la transferencia (simular)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Sidebar Carrito --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-light">Tu Selección</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">{cart.length} artículos añadidos</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-20 h-24 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.images ? item.images[0] : item.image} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-serif">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 uppercase mt-1">
                        {item.category === 'calzado' ? ("Talle " + item.shoeSize) : ("Talle " + item.size)}
                      </p>
                      {item.cuotas && (
                        <p className="text-[8px] text-emerald-600 font-bold mt-1">{item.cuotas}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-black">{"$" + item.price.toLocaleString()}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Estimado</span>
                  <span className="text-2xl font-black text-slate-900">{"$" + cartTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsPaymentModalOpen(true);
                  }}
                  className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#d4af37] transition-all flex items-center justify-center gap-2"
                >
                  Continuar con el pago <ArrowRight size={16} />
                </button>
                <p className="text-[8px] text-center text-slate-400 mt-4">
                  *Los productos se reservan hasta confirmar el pago
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Nav Móvil con CHAT en lugar de FAVORITOS --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 h-18 flex items-center justify-around z-50 px-6 shadow-2xl">
        {/* Buscar */}
        <button 
          className="text-black p-2" 
          onClick={() => {
            setSelectedCategory(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Search size={22} />
        </button>
        
        {/* Carrito */}
        <button 
          className="text-slate-400 p-2 relative" 
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingBag size={22} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
        
        {/* Publicar (botón central flotante) */}
        <button
          onClick={() => {
            if (user) {
              if (!user.canPublish && !user.isMainAdmin) {
                alert("No tienes permiso para publicar. Contacta al administrador.");
                return;
              }
              setIsModalOpen(true);
            } else {
              alert("Debes iniciar sesión para publicar");
            }
          }}
          className="bg-black text-white p-4 rounded-full shadow-2xl -translate-y-5 border-4 border-[#FDFCFB]"
        >
          <PlusCircle size={26} />
        </button>
        
        {/* CHAT */}
        <button 
          className="text-slate-400 p-2 relative" 
          onClick={() => {
            if (user) {
              setSelectedUserProfile(user.uid);
              setTimeout(() => {
                setSelectedTab('chats');
              }, 200);
            } else {
              handleGoogleLogin();
            }
          }}
        >
          <MessageCircle size={22} />
          {getUnreadChatCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {getUnreadChatCount()}
            </span>
          )}
        </button>
        
        {/* Perfil */}
        <button 
          className="text-slate-400 p-2" 
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
