import React, { useState, useMemo } from 'react';
import { 
  Search, ShoppingBag, User, Heart, 
  PlusCircle, X, Camera, ChevronRight, 
  Trash2, ArrowRight, Tag, Check, Edit3, Lock
} from 'lucide-react';

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
  { id: 'ropa-interior', name: 'Ropa Interior', image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&q=80&w=200' },
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
const GENDERS = ["Masculino", "Femenino"];
const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "Único"];

const INITIAL_PRODUCTS = [
  { id: 1, user: { name: "Roma_Premium", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roma" }, image: "https://images.unsplash.com/photo-1539109132314-347752418b30?auto=format&fit=crop&q=80&w=600", title: "Vestido Gala Seda Italiana", price: 125000, size: "S", category: "vestidos", condition: "Ropa nueva con etiqueta", gender: "Femenino", ageGroup: "Adulto", cuotas: "12 cuotas sin interés", comision: "15%" },
  { id: 2, user: { name: "Nico_Boutique", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nico" }, image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=600", title: "Remera Algodón Pima", price: 18000, size: "L", category: "remeras", condition: "Ropa como nueva", gender: "Masculino", ageGroup: "Juvenil", cuotas: "6 cuotas sin interés", comision: "10%" },
  { id: 3, user: { name: "Street_King", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=King" }, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600", title: "Gorra Snapback Black", price: 15000, size: "Único", category: "gorras", condition: "Ropa nueva con etiqueta", gender: "Masculino", ageGroup: "Juvenil", cuotas: "3 cuotas sin interés", comision: "10%" }
];

export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
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

  const handleUpload = (e) => {
    e.preventDefault();
    const productToAdd = {
      id: Date.now(),
      user: { name: "Mi_Perfil", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Me" },
      image: newProduct.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400",
      ...newProduct,
      price: parseInt(newProduct.price) || 0,
    };
    setProducts([productToAdd, ...products]);
    setIsModalOpen(false);
    setNewProduct({ title: "", price: "", size: "M", image: "", condition: "Ropa usada", category: "remeras", gender: "Femenino", ageGroup: "Adulto", cuotas: "", comision: "" });
  };

  const handleSaleBannerClick = () => {
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

  const toggleLike = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  const addToCart = (product) => {
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = !selectedCategory || p.category === selectedCategory;
      const matchesGender = selectedGender === "Todo" || p.gender === selectedGender;
      const matchesAge = selectedAge === "Todo" || p.ageGroup === selectedAge;
      
      // Filtro por condición agrupada
      let matchesCondition = true;
      if (selectedConditionGroup === "outlet") {
        matchesCondition = p.condition === "Ropa nueva con etiqueta";
      } else if (selectedConditionGroup === "showroom") {
        matchesCondition = ["Ropa nueva sin etiqueta", "Ropa como nueva", "Ropa usada"].includes(p.condition);
      } else if (selectedConditionGroup !== "Todas") {
        matchesCondition = p.condition === selectedConditionGroup;
      }
      
      return matchesSearch && matchesCat && matchesGender && matchesAge && matchesCondition;
    });
  }, [products, searchTerm, selectedCategory, selectedGender, selectedAge, selectedConditionGroup]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

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
            onClick={() => {setSelectedCategory(null); setSelectedGender("Todo"); setSelectedAge("Todo"); setSearchTerm(""); setSelectedConditionGroup("Todas");}}
          >
            <span className="text-2xl md:text-3xl font-serif tracking-[0.2em] font-light group-hover:text-[#d4af37] transition-colors uppercase tracking-widest">+Roma</span>
            <div className="flex items-center gap-1">
              <div className="h-[1px] w-4 bg-[#d4af37]"></div>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">Showroom</span>
            </div>
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
              onClick={() => setIsModalOpen(true)}
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
            <div className="hidden sm:flex w-9 h-9 rounded-full bg-slate-100 border border-slate-200 items-center justify-center cursor-pointer">
               <User size={18} className="text-slate-500" />
            </div>
          </div>
        </div>
      </header>

      {/* --- Filtros --- */}
      <div className="bg-white border-b sticky top-20 z-40 overflow-x-auto no-scrollbar shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-6 min-w-max">
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-50">
            {["Todo", "Masculino", "Femenino"].map(g => (
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

      {/* --- Categorías --- */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6">
          {CATEGORIES.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)} 
              className={`group flex-shrink-0 cursor-pointer flex flex-col items-center transition-all ${selectedCategory === cat.id ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}
            >
              <div className={`relative w-20 h-20 md:w-28 md:h-28 rounded-3xl overflow-hidden border-2 transition-all ${selectedCategory === cat.id ? 'border-[#d4af37] shadow-xl' : 'border-transparent shadow-sm'}`}>
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/5"></div>
              </div>
              <span className={`mt-3 text-[10px] font-black uppercase tracking-[0.2em] ${selectedCategory === cat.id ? 'text-[#d4af37]' : 'text-slate-500'}`}>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- Catálogo (3 COL en Móvil, 4 en Desktop) --- */}
      <main className="container mx-auto px-4 lg:px-8 mb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-serif font-light">Explorar Piezas</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colección curada: {filteredProducts.length} items</p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            <button 
              onClick={() => setSelectedConditionGroup("Todas")} 
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedConditionGroup === 'Todas' ? 'bg-black border-black text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setSelectedConditionGroup("outlet")} 
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedConditionGroup === 'outlet' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-red-300'}`}
            >
              Outlet +Roma
            </button>
            <button 
              onClick={() => setSelectedConditionGroup("showroom")} 
              className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedConditionGroup === 'showroom' ? 'bg-black border-black text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
            >
              Showroom +Roma
            </button>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="group flex flex-col h-full bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100">
                <div className="p-2 md:p-4 flex items-center justify-between bg-white z-10">
                  <div className="flex items-center gap-1.5">
                    <img src={product.user.avatar} className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-slate-50" alt="" />
                    <span className="text-[7px] md:text-[10px] font-bold text-slate-900 truncate max-w-[40px] md:max-w-none">{product.user.name}</span>
                  </div>
                  <button onClick={() => toggleLike(product.id)} className="p-0.5">
                    <Heart size={14} className={`${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-200'}`} />
                  </button>
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

      {/* --- Modal Admin SALE! --- */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAdminModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold italic flex items-center gap-2 tracking-tighter"><Edit3 /> Editor SALE!</h2>
              <button onClick={() => setShowAdminModal(false)}><X /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Título del Banner</label>
                <input 
                  className="w-full bg-slate-50 border p-4 rounded-2xl outline-none focus:border-black"
                  value={saleConfig.title}
                  onChange={(e) => setSaleConfig({...saleConfig, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Precio/Promo (Ej: 50% OFF)</label>
                <input 
                  className="w-full bg-slate-50 border p-4 rounded-2xl outline-none focus:border-black"
                  value={saleConfig.promo}
                  onChange={(e) => setSaleConfig({...saleConfig, promo: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Vigencia/Texto adicional</label>
                <input 
                  className="w-full bg-slate-50 border p-4 rounded-2xl outline-none focus:border-black"
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
              <button 
                onClick={() => setShowAdminModal(false)}
                className="w-full bg-black text-white py-5 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest shadow-xl"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal de Venta (con campos nuevos) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="hidden md:block w-1/3 bg-[#d4af37] p-10 text-white flex flex-col justify-between">
              <div>
                <h2 className="text-4xl font-serif italic mb-2">+Roma</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Nueva Publicación</p>
              </div>
            </div>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-bold tracking-tight">Vende tu Prenda</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleUpload} className="space-y-6">
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
                
                {/* Nuevos campos: Cuotas y Comisión */}
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
                
                <input 
                  type="url" 
                  placeholder="URL de la imagen" 
                  className="w-full bg-slate-50 border rounded-2xl py-3.5 px-5 outline-none" 
                  onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} 
                />
                
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
        <button onClick={() => setIsModalOpen(true)} className="bg-black text-white p-4 rounded-full shadow-2xl -translate-y-5 border-4 border-[#FDFCFB]"><PlusCircle size={26} /></button>
        <button className="text-slate-400 p-2"><Heart size={22} /></button>
        <button className="text-slate-400 p-2"><User size={22} /></button>
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
