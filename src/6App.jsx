import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ShoppingBag, User, Heart, 
  PlusCircle, X, Camera, ChevronRight, 
  Trash2, ArrowRight, Tag, Check, Edit3, Lock, CheckCircle, Clock, AlertCircle,
  LogOut, Settings, Image as ImageIcon, Users, ThumbsUp
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// --- Configuración de Firebase (Vulnerable - Mover a variables de entorno) ---
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
const googleProvider = new GoogleAuthProvider();

// --- Configuración y Constantes ---
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
  { id: 'accesorios', name: 'Accesorios', image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=200' },
  { id: 'ropa-interior', name: 'Ropa Interior', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=200' },
  { id: 'maquillajes', name: 'Maquillajes', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=200' },
];

const BRANDS = [
  "Nike", "Adidas", "Puma", "Calvin Klein", "Zara", "H&M", "Gucci", "Prada", 
  "Versace", "Tommy Hilfiger", "Lacoste", "Levi's", "The North Face", "Vans"
].map(name => ({
  name,
  logo: `https://logo.clearbit.com/${name.toLowerCase().replace(/\s/g, '').replace("'", "")}.com`
}));

const CONDITIONS = ["Ropa nueva con etiqueta", "Ropa nueva sin etiqueta", "Ropa como nueva", "Ropa usada"];
const AGE_GROUPS = ["Bebés", "Kids", "Juvenil", "Adulto", "Mayor"];
const GENDERS = ["Masculino", "Femenino", "Unisex"];
const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "Único"];

// Datos iniciales de usuarios y productos
const INITIAL_USERS = {
  "user1": {
    uid: "user1",
    name: "Roma_Premium",
    email: "roma@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roma",
    followers: 245,
    following: 89,
    bio: "Apasionada por la moda vintage",
    coverImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=1200"
  }
};

const INITIAL_PRODUCTS = [
  { 
    id: 1, 
    userId: "user1",
    user: { name: "Roma_Premium", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roma" }, 
    image: "https://images.unsplash.com/photo-1539109132314-347752418b30?auto=format&fit=crop&q=80&w=600", 
    title: "Vestido Gala Seda Italiana", 
    price: 125000, 
    size: "S", 
    category: "vestidos", 
    condition: "Ropa nueva con etiqueta", 
    gender: "Femenino", 
    ageGroup: "Adulto", 
    cuotas: "12 cuotas sin interés", 
    comision: "15%",
    likes: 45,
    status: { iniciada: true, verificada: true, aprobada: true, publicada: true } 
  },
  { 
    id: 2, 
    userId: "user2",
    user: { name: "Nico_Boutique", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nico" }, 
    image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=600", 
    title: "Remera Algodón Pima", 
    price: 18000, 
    size: "L", 
    category: "remeras", 
    condition: "Ropa como nueva", 
    gender: "Masculino", 
    ageGroup: "Juvenil", 
    cuotas: "6 cuotas sin interés", 
    comision: "10%",
    likes: 23,
    status: { iniciada: true, verificada: true, aprobada: true, publicada: true } 
  },
  { 
    id: 3, 
    userId: "user3",
    user: { name: "Street_King", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=King" }, 
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600", 
    title: "Gorra Snapback Black", 
    price: 15000, 
    size: "Único", 
    category: "gorras", 
    condition: "Ropa nueva con etiqueta", 
    gender: "Masculino", 
    ageGroup: "Juvenil", 
    cuotas: "3 cuotas sin interés", 
    comision: "10%",
    likes: 12,
    status: { iniciada: true, verificada: true, aprobada: true, publicada: true } 
  }
];

// Publicaciones pendientes
const PENDING_PUBLICATIONS = [
  { 
    id: 101, 
    userId: "user4",
    user: { name: "Ana_Moda", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana" }, 
    image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=600", 
    title: "Vestido Floral Primavera", 
    price: 45000, 
    size: "M", 
    category: "vestidos", 
    condition: "Ropa nueva sin etiqueta", 
    gender: "Femenino", 
    ageGroup: "Adulto", 
    cuotas: "6 cuotas sin interés", 
    comision: "12%",
    likes: 0,
    status: { iniciada: true, verificada: false, aprobada: false, publicada: false } 
  },
  { 
    id: 102, 
    userId: "user5",
    user: { name: "Carlos_Sport", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos" }, 
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600", 
    title: "Zapatillas Running Pro", 
    price: 89000, 
    size: "42", 
    category: "calzado", 
    condition: "Ropa nueva con etiqueta", 
    gender: "Masculino", 
    ageGroup: "Adulto", 
    cuotas: "12 cuotas sin interés", 
    comision: "15%",
    likes: 0,
    status: { iniciada: true, verificada: true, aprobada: false, publicada: false } 
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [pendingProducts, setPendingProducts] = useState(PENDING_PUBLICATIONS);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  
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

  // Estados para los filtros desplegables
  const [showOutletOptions, setShowOutletOptions] = useState(false);
  const [showShowroomOptions, setShowShowroomOptions] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGender, setSelectedGender] = useState("Todo");
  const [selectedAge, setSelectedAge] = useState("Todo");
  const [selectedCondition, setSelectedCondition] = useState("Todas");
  const [selectedConditionGroup, setSelectedConditionGroup] = useState("Todas");

  // Nuevo Producto
  const [newProduct, setNewProduct] = useState({
    title: "", price: "", size: "M", image: "", condition: "Ropa usada", 
    category: "remeras", gender: "Femenino", ageGroup: "Adulto",
    cuotas: "", comision: ""
  });

  // Perfil del usuario
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    avatar: "",
    coverImage: ""
  });

  // Efecto para monitorear el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Verificar si el usuario ya existe en nuestra base de datos local
        const existingUser = Object.values(users).find(u => u.uid === firebaseUser.uid);
        
        if (existingUser) {
          setUser(existingUser);
          setProfileData({
            name: existingUser.name,
            bio: existingUser.bio || "",
            avatar: existingUser.avatar || firebaseUser.photoURL,
            coverImage: existingUser.coverImage || ""
          });
        } else {
          // Crear nuevo usuario local
          const newUser = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "Usuario",
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
            followers: 0,
            following: 0,
            bio: "",
            coverImage: ""
          };
          setUsers(prev => ({ ...prev, [firebaseUser.uid]: newUser }));
          setUser(newUser);
          setProfileData({
            name: newUser.name,
            bio: "",
            avatar: newUser.avatar,
            coverImage: ""
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

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setUsers(prev => ({
      ...prev,
      [user.uid]: {
        ...prev[user.uid],
        name: profileData.name,
        bio: profileData.bio,
        avatar: profileData.avatar,
        coverImage: profileData.coverImage
      }
    }));
    setUser(prev => ({
      ...prev,
      name: profileData.name,
      avatar: profileData.avatar,
      bio: profileData.bio,
      coverImage: profileData.coverImage
    }));
    setIsEditProfileOpen(false);
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'avatar') {
          setProfileData(prev => ({ ...prev, avatar: reader.result }));
        } else if (type === 'cover') {
          setProfileData(prev => ({ ...prev, coverImage: reader.result }));
        } else if (type === 'product') {
          setNewProduct(prev => ({ ...prev, image: reader.result }));
        } else if (type === 'editProduct') {
          setEditingProduct(prev => ({ ...prev, image: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!user) {
      alert("Debes iniciar sesión para publicar");
      return;
    }

    const productToAdd = {
      id: Date.now(),
      userId: user.uid,
      user: { 
        name: user.name, 
        avatar: user.avatar 
      },
      image: newProduct.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400",
      ...newProduct,
      price: parseInt(newProduct.price) || 0,
      likes: 0,
      status: { iniciada: true, verificada: false, aprobada: false, publicada: false }
    };
    setPendingProducts([productToAdd, ...pendingProducts]);
    setIsModalOpen(false);
    setNewProduct({ title: "", price: "", size: "M", image: "", condition: "Ropa usada", category: "remeras", gender: "Femenino", ageGroup: "Adulto", cuotas: "", comision: "" });
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsEditProductOpen(true);
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    
    // Remover del catálogo si estaba publicado
    setProducts(prev => prev.filter(p => p.id !== editingProduct.id));
    
    // Actualizar en pendientes o agregar como nuevo pendiente
    const existingPending = pendingProducts.find(p => p.id === editingProduct.id);
    const updatedProduct = {
      ...editingProduct,
      status: { iniciada: true, verificada: false, aprobada: false, publicada: false }
    };
    
    if (existingPending) {
      setPendingProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? updatedProduct : p
      ));
    } else {
      setPendingProducts(prev => [updatedProduct, ...prev]);
    }
    
    setIsEditProductOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
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

  const handleStatusChange = (productId, statusType) => {
    setPendingProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newStatus = { ...p.status };
        
        if (statusType === 'verificada') {
          newStatus.verificada = !newStatus.verificada;
        } else if (statusType === 'aprobada') {
          newStatus.aprobada = !newStatus.aprobada;
          if (newStatus.aprobada && newStatus.verificada) {
            newStatus.publicada = true;
            // Mover a productos publicados
            const publishedProduct = { ...p, status: newStatus };
            setProducts(prev => [publishedProduct, ...prev]);
            return null; // Marcar para eliminar de pendientes
          }
        }
        return { ...p, status: newStatus };
      }
      return p;
    }).filter(p => p !== null));
  };

  const handleAdminEditProduct = (productId, updatedData) => {
    setPendingProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, ...updatedData } : p
    ));
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, ...updatedData } : p
    ));
  };

  const toggleLike = (id) => {
    if (!user) {
      alert("Debes iniciar sesión para dar like");
      return;
    }
    
    setProducts(prev => prev.map(p => 
      p.id === id 
        ? { ...p, likes: favorites.includes(id) ? p.likes - 1 : p.likes + 1 }
        : p
    ));
    
    setFavorites(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  const addToCart = (product) => {
    if (!user) {
      alert("Debes iniciar sesión para comprar");
      return;
    }
    if (cart.find(item => item.id === product.id)) {
      setIsCartOpen(true);
      return;
    }
    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getUserProducts = (userId) => {
    const userProducts = [
      ...products.filter(p => p.userId === userId),
      ...pendingProducts.filter(p => p.userId === userId)
    ];
    return userProducts;
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = !selectedCategory || p.category === selectedCategory;
      const matchesGender = selectedGender === "Todo" || p.gender === selectedGender;
      const matchesAge = selectedAge === "Todo" || p.ageGroup === selectedAge;
      
      let matchesCondition = true;
      if (selectedConditionGroup === "outlet") {
        matchesCondition = p.condition === "Ropa nueva con etiqueta" || p.condition === "Ropa nueva sin etiqueta";
      } else if (selectedConditionGroup === "showroom") {
        matchesCondition = p.condition === "Ropa como nueva" || p.condition === "Ropa usada";
      } else if (selectedConditionGroup !== "Todas") {
        matchesCondition = p.condition === selectedConditionGroup;
      }
      
      return matchesSearch && matchesCat && matchesGender && matchesAge && matchesCondition;
    });
  }, [products, searchTerm, selectedCategory, selectedGender, selectedAge, selectedConditionGroup]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Cerrar opciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setShowOutletOptions(false);
      setShowShowroomOptions(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 pb-20 selection:bg-[#d4af37]/30">
      
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
          <div 
            className="flex flex-col cursor-pointer group" 
            onClick={handleLogoClick}
          >
            <img 
              src="/masroma.png" 
              alt="+Roma" 
              className="h-12 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
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
            <button 
              onClick={() => {
                if (user) {
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
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-slate-600 hover:text-black transition-colors">
              <ShoppingBag size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
            {user ? (
              <div 
                className="relative cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-[#d4af37] overflow-hidden">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 bg-gradient-to-r from-[#d4af37] to-yellow-500 text-white">
                      <p className="font-bold truncate">{user.name}</p>
                      <p className="text-xs opacity-80 truncate">{user.email}</p>
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
              <button key={g} onClick={() => setSelectedGender(g)} className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${selectedGender === g ? 'bg-black text-white shadow-md' : 'text-slate-400 hover:text-black'}`}>{g}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {["Todo", ...AGE_GROUPS].map(age => (
              <button key={age} onClick={() => setSelectedAge(age)} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase border transition-all ${selectedAge === age ? 'bg-[#d4af37] border-[#d4af37] text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-black'}`}>{age}</button>
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
              className={`group flex-shrink-0 cursor-pointer flex flex-col items-center transition-all ${selectedCategory === cat.id ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}
            >
              <div className={`relative w-20 h-20 md:w-28 md:h-28 rounded-3xl overflow-hidden border-2 transition-all ${selectedCategory === cat.id ? 'border-[#d4af37] shadow-xl' : 'border-transparent shadow-sm'}`}>
                <img 
                  src={
                    cat.id === 'ropa-interior' 
                      ? 'https://images.unsplash.com/photo-1626804475299-6a383922b5dc?auto=format&fit=crop&q=80&w=200'
                      : cat.id === 'accesorios'
                      ? 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&q=80&w=200'
                      : cat.image
                  } 
                  alt={cat.name} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/5"></div>
              </div>
              <span className={`mt-3 text-[10px] font-black uppercase tracking-[0.2em] ${selectedCategory === cat.id ? 'text-[#d4af37]' : 'text-slate-500'}`}>{cat.name}</span>
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
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 relative">
            <button 
              onClick={() => setSelectedConditionGroup("Todas")} 
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedConditionGroup === 'Todas' ? 'bg-black border-black text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
            >
              Todas
            </button>
            
            {/* Outlet +Roma con imagen y opciones */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => {
                  setShowOutletOptions(!showOutletOptions);
                  setShowShowroomOptions(false);
                }}
                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${selectedConditionGroup === 'outlet' || selectedConditionGroup === 'Ropa nueva con etiqueta' || selectedConditionGroup === 'Ropa nueva sin etiqueta' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-red-300'}`}
              >
                <img src="/outlet.png" alt="Outlet" className="w-4 h-4 object-contain" />
                Outlet +Roma
              </button>
              
              {showOutletOptions && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 min-w-[180px] z-50">
                  <button 
                    onClick={() => {
                      setSelectedConditionGroup('Ropa nueva con etiqueta');
                      setShowOutletOptions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-xs hover:bg-slate-50 transition-colors"
                  >
                    Nuevo con etiqueta
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedConditionGroup('Ropa nueva sin etiqueta');
                      setShowOutletOptions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-xs hover:bg-slate-50 transition-colors"
                  >
                    Nuevo sin etiqueta
                  </button>
                </div>
              )}
            </div>
            
            {/* Showroom +Roma con imagen y opciones */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => {
                  setShowShowroomOptions(!showShowroomOptions);
                  setShowOutletOptions(false);
                }}
                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${selectedConditionGroup === 'showroom' || selectedConditionGroup === 'Ropa como nueva' || selectedConditionGroup === 'Ropa usada' ? 'bg-black border-black text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
              >
                <img src="/showroom.png" alt="Showroom" className="w-4 h-4 object-contain" />
                Showroom +Roma
              </button>
              
              {showShowroomOptions && (
                <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 min-w-[180px] z-50">
                  <button 
                    onClick={() => {
                      setSelectedConditionGroup('Ropa como nueva');
                      setShowShowroomOptions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-xs hover:bg-slate-50 transition-colors"
                  >
                    Usado como nuevo
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedConditionGroup('Ropa usada');
                      setShowShowroomOptions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-xs hover:bg-slate-50 transition-colors"
                  >
                    Usado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="group flex flex-col h-full bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100">
                <div className="p-2 md:p-4 flex items-center justify-between bg-white z-10">
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                    onClick={() => setSelectedUserProfile(product.userId)}
                  >
                    <img src={product.user.avatar} className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-slate-50" alt="" />
                    <span className="text-[7px] md:text-[10px] font-bold text-slate-900 truncate max-w-[40px] md:max-w-none">{product.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] md:text-[10px] text-slate-400 flex items-center gap-1">
                      <ThumbsUp size={10} /> {product.likes}
                    </span>
                    <button onClick={() => toggleLike(product.id)} className="p-0.5">
                      <Heart size={14} className={`${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-200'}`} />
                    </button>
                  </div>
                </div>

                <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
                  <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={product.title} />
                  <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3">
                    <span className="bg-white/90 backdrop-blur-sm text-black text-[6px] md:text-[9px] font-black px-1.5 py-0.5 md:px-3 md:py-1.5 rounded-full shadow-lg uppercase border border-slate-100">Talle {product.size}</span>
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
                  
                  <div className="mt-auto flex flex-col md:flex-row md:items-end md:justify-between border-t border-slate-50 pt-2 md:pt-4">
                    <div className="flex flex-col">
                      <span className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Precio</span>
                      <span className="text-xs md:text-xl font-black text-slate-900">${product.price.toLocaleString()}</span>
                      {product.comision && (
                        <span className="text-[6px] md:text-[8px] text-slate-400">Comisión: {product.comision}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 border-b md:border-b-2 border-black pb-0.5 md:pb-1 mt-2 md:mt-0 hover:text-[#d4af37] hover:border-[#d4af37] transition-all self-start md:self-auto"
                    >
                      Comprar
                    </button>
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
                
                <div className="flex gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-slate-400" />
                    <span className="font-bold">{users[selectedUserProfile]?.followers || 0}</span>
                    <span className="text-slate-400 text-sm">seguidores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-slate-400" />
                    <span className="font-bold">{users[selectedUserProfile]?.following || 0}</span>
                    <span className="text-slate-400 text-sm">siguiendo</span>
                  </div>
                </div>
              </div>
              
              {/* Publicaciones del usuario */}
              <div className="mt-8">
                <h4 className="text-lg font-bold mb-4">Publicaciones</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getUserProducts(selectedUserProfile).map(product => (
                    <div key={product.id} className="border rounded-xl overflow-hidden">
                      <img src={product.image} alt={product.title} className="w-full h-32 object-cover" />
                      <div className="p-3">
                        <p className="font-bold text-sm truncate">{product.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1">${product.price.toLocaleString()}</p>
                        
                        {/* Estado de la publicación */}
                        <div className="mt-2 flex items-center gap-1 text-[8px]">
                          <div className={`w-1.5 h-1.5 rounded-full ${product.status.iniciada ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                          <div className={`w-1.5 h-1.5 rounded-full ${product.status.verificada ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                          <div className={`w-1.5 h-1.5 rounded-full ${product.status.aprobada ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                          <div className={`w-1.5 h-1.5 rounded-full ${product.status.publicada ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[8px] text-slate-400 flex items-center gap-1">
                            <ThumbsUp size={8} /> {product.likes}
                          </span>
                          {user?.uid === selectedUserProfile && (
                            <button 
                              onClick={() => handleEditProduct(product)}
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
              </div>
            </div>
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
              
              <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest mt-4">
                Guardar Cambios
              </button>
            </form>
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

            {/* Gestión de Publicaciones Pendientes */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock size={18} /> Publicaciones Pendientes ({pendingProducts.length})</h3>
              <div className="space-y-6">
                {pendingProducts.map(product => (
                  <div key={product.id} className="border rounded-3xl p-6 bg-white shadow-sm">
                    <div className="flex gap-4">
                      <img src={product.image} alt={product.title} className="w-24 h-24 object-cover rounded-2xl" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-lg">{product.title}</h4>
                            <p className="text-sm text-slate-500">por {product.user.name}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleStatusChange(product.id, 'verificada')}
                              className={`p-2 rounded-full transition-all ${product.status.verificada ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                              title="Verificar"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(product.id, 'aprobada')}
                              className={`p-2 rounded-full transition-all ${product.status.aprobada ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                              title="Aprobar"
                            >
                              <Check size={20} />
                            </button>
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-all"
                              title="Editar"
                            >
                              <Edit3 size={20} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Progreso de publicación */}
                        <div className="mt-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${product.status.iniciada ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                                {product.status.iniciada ? <Check size={14} /> : '1'}
                              </div>
                              <span className="text-xs">Iniciada</span>
                            </div>
                            <div className="w-8 h-[2px] bg-slate-200"></div>
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${product.status.verificada ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                                {product.status.verificada ? <Check size={14} /> : '2'}
                              </div>
                              <span className="text-xs">Verificada</span>
                            </div>
                            <div className="w-8 h-[2px] bg-slate-200"></div>
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${product.status.aprobada ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                                {product.status.aprobada ? <Check size={14} /> : '3'}
                              </div>
                              <span className="text-xs">Aprobada</span>
                            </div>
                            <div className="w-8 h-[2px] bg-slate-200"></div>
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${product.status.publicada ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                                {product.status.publicada ? <Check size={14} /> : '4'}
                              </div>
                              <span className="text-xs">Publicada</span>
                            </div>
                          </div>
                        </div>

                        {/* Detalles del producto */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                          <span className="text-slate-500">Precio: ${product.price.toLocaleString()}</span>
                          <span className="text-slate-500">Talle: {product.size}</span>
                          <span className="text-slate-500">Categoría: {CATEGORIES.find(c => c.id === product.category)?.name}</span>
                          <span className="text-slate-500">Condición: {product.condition}</span>
                          <span className="text-slate-500">Género: {product.gender}</span>
                          <span className="text-slate-500">Edad: {product.ageGroup}</span>
                          {product.cuotas && <span className="text-slate-500">Cuotas: {product.cuotas}</span>}
                          {product.comision && <span className="text-slate-500">Comisión: {product.comision}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Imagen del producto</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden">
                      <img src={editingProduct.image} alt="Producto" className="w-full h-full object-cover" />
                    </div>
                    <label className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'editProduct')}
                        className="hidden"
                      />
                      Cambiar imagen
                    </label>
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
                
                <input 
                  type="number" 
                  placeholder="Precio ($)" 
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none" 
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} 
                  required 
                />
                
                <input 
                  type="text" 
                  placeholder="Cuotas sin interés (ej: 12 cuotas sin interés)" 
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none" 
                  value={editingProduct.cuotas || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, cuotas: e.target.value})} 
                />
                
                <input 
                  type="text" 
                  placeholder="Comisión (ej: 15%)" 
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none" 
                  value={editingProduct.comision || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, comision: e.target.value})} 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                    value={editingProduct.size}
                    onChange={(e) => setEditingProduct({...editingProduct, size: e.target.value})}
                  >
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  
                  <select 
                    className="bg-slate-50 border rounded-2xl p-3.5 outline-none"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
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
                
                <div className="bg-yellow-50 p-4 rounded-2xl">
                  <p className="text-xs text-yellow-600 font-bold mb-2">⚠️ Al editar, la publicación volverá al estado "Iniciada" y será removida del catálogo hasta nueva aprobación.</p>
                </div>
                
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

      {/* --- Modal de Venta (con carga de imagen) --- */}
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
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Imagen del producto</label>
                  <div className="flex items-center gap-4">
                    {newProduct.image ? (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden">
                        <img src={newProduct.image} alt="Vista previa" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                        <ImageIcon size={24} className="text-slate-300" />
                      </div>
                    )}
                    <label className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'product')}
                        className="hidden"
                      />
                      Seleccionar imagen
                    </label>
                  </div>
                </div>

                <input 
                  type="text" 
                  placeholder="Título" 
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none" 
                  onChange={(e) => setNewProduct({...newProduct, title: e.target.value})} 
                  required 
                />
                <input 
                  type="number" 
                  placeholder="Precio ($)" 
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none" 
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} 
                  required 
                />
                
                <input 
                  type="text" 
                  placeholder="Cuotas sin interés (ej: 12 cuotas sin interés)" 
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none" 
                  onChange={(e) => setNewProduct({...newProduct, cuotas: e.target.value})} 
                />
                <input 
                  type="text" 
                  placeholder="Comisión (ej: 15%)" 
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none" 
                  onChange={(e) => setNewProduct({...newProduct, comision: e.target.value})} 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-50 border rounded-2xl p-3.5 outline-none" onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="bg-slate-50 border rounded-2xl p-3.5 outline-none" onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-50 border rounded-2xl p-3.5 outline-none" onChange={(e) => setNewProduct({...newProduct, condition: e.target.value})}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="bg-slate-50 border rounded-2xl p-3.5 outline-none" onChange={(e) => setNewProduct({...newProduct, gender: e.target.value})}>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                
                <select className="w-full bg-slate-50 border rounded-2xl p-3.5 outline-none" onChange={(e) => setNewProduct({...newProduct, ageGroup: e.target.value})}>
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
                
                <button type="submit" className="w-full bg-black text-white py-5 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest mt-4">
                  Publicar Ahora
                </button>
              </form>
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
                    <img src={item.image} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-serif">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 uppercase mt-1">Talle {item.size}</p>
                      {item.cuotas && (
                        <p className="text-[8px] text-emerald-600 font-bold mt-1">{item.cuotas}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-black">${item.price.toLocaleString()}</span>
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
                  <span className="text-2xl font-black text-slate-900">${cartTotal.toLocaleString()}</span>
                </div>
                <button className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                  Pagar Ahora <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Nav Móvil --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 h-18 flex items-center justify-around z-50 px-6 shadow-2xl">
        <button className="text-black p-2" onClick={() => setSelectedCategory(null)}><Search size={22} /></button>
        <button className="text-slate-400 p-2" onClick={() => setIsCartOpen(true)}><ShoppingBag size={22} /></button>
        <button 
          onClick={() => {
            if (user) {
              setIsModalOpen(true);
            } else {
              alert("Debes iniciar sesión para publicar");
            }
          }} 
          className="bg-black text-white p-4 rounded-full shadow-2xl -translate-y-5 border-4 border-[#FDFCFB]"
        >
          <PlusCircle size={26} />
        </button>
        <button className="text-slate-400 p-2" onClick={() => {
          if (user) {
            setSelectedUserProfile(user.uid);
          } else {
            handleGoogleLogin();
          }
        }}>
          <User size={22} />
        </button>
        <button className="text-slate-400 p-2"><Heart size={22} /></button>
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-in-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-right { animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .h-18 { height: 4.5rem; }
      `}</style>
    </div>
  );
}
