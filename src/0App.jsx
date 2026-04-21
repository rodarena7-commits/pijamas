import React, { useState, useMemo } from 'react';
import { 
  Search, ShoppingBag, User, Heart, 
  PlusCircle, X, Camera, ChevronRight, 
  Trash2, ArrowRight, Tag, Check
} from 'lucide-react';

// --- Configuración y Constantes ---
const CATEGORIES = [
  { id: 'remeras', name: 'Remeras', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=200' },
  { id: 'camisas', name: 'Camisas', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=200' },
  { id: 'buzos', name: 'Buzos', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=200' },
  { id: 'jeans', name: 'Jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=200' },
  { id: 'pantalones', name: 'Pantalones', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=200' },
  { id: 'camperas', name: 'Camperas', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=200' },
  { id: 'calzado', name: 'Calzado', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200' },
  { id: 'short', name: 'Short', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=200' },
  { id: 'ropa-interior', name: 'Ropa interior', image: 'https://images.unsplash.com/photo-1582533075177-a0d33089146e?auto=format&fit=crop&q=80&w=200' },
  { id: 'mayas', name: 'Mayas', image: 'https://images.unsplash.com/photo-1583392015942-70b88c7f070c?auto=format&fit=crop&q=80&w=200' },
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

const INITIAL_PRODUCTS = [
  {
    id: 1,
    user: { name: "Roma_Premium", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roma" },
    image: "https://images.unsplash.com/photo-1539109132314-347752418b30?auto=format&fit=crop&q=80&w=600",
    title: "Vestido Gala Seda Italiana",
    price: 125000,
    size: "S",
    category: "mayas",
    condition: "Ropa nueva con etiqueta",
    gender: "Femenino",
    ageGroup: "Adulto",
  },
  {
    id: 2,
    user: { name: "Nico_Boutique", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nico" },
    image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=600",
    title: "Remera Algodón Pima",
    price: 18000,
    size: "L",
    category: "remeras",
    condition: "Ropa como nueva",
    gender: "Masculino",
    ageGroup: "Juvenil",
  },
  {
    id: 3,
    user: { name: "Vintage_Store", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vintage" },
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600",
    title: "Jeans Levi's 501 Original",
    price: 45000,
    size: "32",
    category: "jeans",
    condition: "Ropa usada",
    gender: "Masculino",
    ageGroup: "Adulto",
  },
  {
    id: 4,
    user: { name: "Sport_Outlet", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sport" },
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600",
    title: "Buzo Oversize Hoodie",
    price: 32000,
    size: "XL",
    category: "buzos",
    condition: "Ropa nueva sin etiqueta",
    gender: "Unisex",
    ageGroup: "Juvenil",
  },
  {
    id: 5,
    user: { name: "Urban_Vibes", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Urban" },
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=600",
    title: "Short de Verano Casual",
    price: 15000,
    size: "M",
    category: "short",
    condition: "Ropa usada",
    gender: "Femenino",
    ageGroup: "Juvenil",
  },
  {
    id: 6,
    user: { name: "Elegance_H", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elegance" },
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600",
    title: "Camisa Lino Blanca",
    price: 28000,
    size: "L",
    category: "camisas",
    condition: "Ropa nueva sin etiqueta",
    gender: "Masculino",
    ageGroup: "Adulto",
  },
  {
    id: 7,
    user: { name: "Street_King", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=King" },
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600",
    title: "Zapatillas Deportivas",
    price: 55000,
    size: "42",
    category: "calzado",
    condition: "Ropa como nueva",
    gender: "Masculino",
    ageGroup: "Adulto",
  },
  {
    id: 8,
    user: { name: "Baby_Lux", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Baby" },
    image: "https://images.unsplash.com/photo-1522771935876-24971164c89e?auto=format&fit=crop&q=80&w=600",
    title: "Conjunto Algodón Bebé",
    price: 12000,
    size: "6M",
    category: "remeras",
    condition: "Ropa nueva con etiqueta",
    gender: "Unisex",
    ageGroup: "Bebés",
  }
];

export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGender, setSelectedGender] = useState("Todo");
  const [selectedAge, setSelectedAge] = useState("Todo");
  const [selectedCondition, setSelectedCondition] = useState("Todas");

  // Nuevo Producto
  const [newProduct, setNewProduct] = useState({
    title: "", price: "", size: "M", image: "", condition: "Ropa usada", 
    category: "remeras", gender: "Femenino", ageGroup: "Adulto"
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
    setNewProduct({ title: "", price: "", size: "M", image: "", condition: "Ropa usada", category: "remeras", gender: "Femenino", ageGroup: "Adulto" });
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
      const matchesCond = selectedCondition === "Todas" || p.condition === selectedCondition;
      return matchesSearch && matchesCat && matchesGender && matchesAge && matchesCond;
    });
  }, [products, searchTerm, selectedCategory, selectedGender, selectedAge, selectedCondition]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 pb-20 selection:bg-[#d4af37]/30">
      
      {/* --- Navegación --- */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <div 
            className="flex flex-col cursor-pointer group" 
            onClick={() => {setSelectedCategory(null); setSelectedGender("Todo"); setSelectedAge("Todo"); setSearchTerm("");}}
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

      {/* --- Marcas --- */}
      <section className="bg-slate-50/50 py-8 border-y border-slate-100 mb-10 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            {BRANDS.map((brand, idx) => (
              <img key={idx} src={brand.logo} alt={brand.name} className="h-6 w-auto object-contain hover:scale-110 cursor-pointer" title={brand.name} onError={(e) => e.target.style.display='none'} />
            ))}
          </div>
        </div>
      </section>

      {/* --- Catálogo (3 COLUMNAS EN MÓVIL, 4 EN DESKTOP) --- */}
      <main className="container mx-auto px-4 lg:px-8 mb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-serif font-light">Explorar Piezas</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colección curada: {filteredProducts.length} items</p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {["Todas", ...CONDITIONS].map(cond => (
              <button key={cond} onClick={() => setSelectedCondition(cond)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedCondition === cond ? 'bg-black border-black text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>{cond}</button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          /* GRID AJUSTADA: grid-cols-3 para móviles */
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
                  </div>
                  
                  <div className="mt-auto flex flex-col md:flex-row md:items-end md:justify-between border-t border-slate-50 pt-2 md:pt-4">
                    <div className="flex flex-col">
                      <span className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Precio</span>
                      <span className="text-xs md:text-xl font-black text-slate-900">${product.price.toLocaleString()}</span>
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
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="text-sm">Tu bolsa está vacía</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-24 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 font-serif">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">Talle {item.size}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-black">${item.price.toLocaleString()}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Estimado</span>
                  <span className="text-2xl font-black text-slate-900">${cartTotal.toLocaleString()}</span>
                </div>
                <button className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#d4af37] transition-all flex items-center justify-center gap-3">
                  Pagar Ahora <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Modal Publicar --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="hidden md:block w-1/3 bg-[#d4af37] p-10 text-white flex flex-col justify-between">
              <div>
                <h2 className="text-4xl font-serif italic mb-2">+Roma</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Nueva Publicación</p>
              </div>
              <div className="space-y-4 opacity-70">
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest"><Check size={16}/> Fotos Claras</div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest"><Check size={16}/> Buen Precio</div>
              </div>
            </div>

            <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Vende tu Prenda</h3>
                  <p className="text-xs text-slate-400 mt-1">Llegá a miles de compradores exclusivos.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-black transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="Título de la prenda" className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:ring-1 focus:ring-[#d4af37]" onChange={(e) => setNewProduct({...newProduct, title: e.target.value})} required />
                  <input type="number" placeholder="Precio ($)" className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:ring-1 focus:ring-[#d4af37]" onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <select className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 text-sm outline-none" onChange={(e) => setNewProduct({...newProduct, size: e.target.value})}>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 text-sm outline-none" onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONDITIONS.map(cond => (
                      <button key={cond} type="button" onClick={() => setNewProduct({...newProduct, condition: cond})} className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition-all ${newProduct.condition === cond ? 'bg-black text-white border-black' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>{cond}</button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input type="url" placeholder="URL de la imagen" className="w-full bg-slate-50 border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:ring-1 focus:ring-[#d4af37]" onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} />
                  <Camera className="absolute right-5 top-3.5 text-slate-300" size={18} />
                </div>
                <button type="submit" className="w-full bg-black text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-[#d4af37] shadow-xl transition-all mt-4">Publicar Ahora</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- Navegación Móvil --- */}
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

