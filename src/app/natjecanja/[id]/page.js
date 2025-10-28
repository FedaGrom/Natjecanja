"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import Swal from 'sweetalert2';

export default function DetaljiNatjecanja() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [natjecanje, setNatjecanje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [contentBlocks, setContentBlocks] = useState([]);
  const [saving, setSaving] = useState(false);

  // Function to get gradient style for category
  const getCategoryGradient = (kategorija) => {
    const categoryGradientMap = {
      SPORT: 'linear-gradient(135deg, #3B82F6, #10B981)',
      'DRUŠTVENE IGRE TURNIR': 'linear-gradient(135deg, #8B5CF6, #EC4899)',
      KVIZOVI: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      GLAZBA: 'linear-gradient(135deg, #EF4444, #F97316)',
      OSTALO: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
    };
    return categoryGradientMap[kategorija] || 'linear-gradient(135deg, #6B7280, #9CA3AF)';
  };

  // Load competition data
  useEffect(() => {
    const loadNatjecanje = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'natjecanja', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setNatjecanje(data);
          setContentBlocks(data.contentBlocks || []);
        } else {
          // Try localStorage as fallback
          const localNatjecanja = JSON.parse(localStorage.getItem('natjecanja') || '[]');
          const found = localNatjecanja.find(n => n.id === id);
          if (found) {
            setNatjecanje(found);
            setContentBlocks(found.contentBlocks || []);
          } else {
            router.push('/natjecanja');
          }
        }
      } catch (error) {
        console.error('Error loading competition:', error);
        // Try localStorage as fallback
        const localNatjecanja = JSON.parse(localStorage.getItem('natjecanja') || '[]');
        const found = localNatjecanja.find(n => n.id === id);
        if (found) {
          setNatjecanje(found);
          setContentBlocks(found.contentBlocks || []);
        } else {
          router.push('/natjecanja');
        }
      } finally {
        setLoading(false);
      }
    };

    loadNatjecanje();
  }, [id, router]);

  // Handle registration
  const handlePrijava = () => {
    if (natjecanje.tipPrijave === 'custom' && natjecanje.prijavaLink) {
      window.open(natjecanje.prijavaLink, '_blank');
    } else {
      alert('Funkcionalnost prijave će biti implementirana uskoro.');
    }
  };

  // Add new content block
  const addContentBlock = (type) => {
    const newBlock = {
      id: Date.now().toString(),
      type: type,
      content: type === 'title' ? 'Novi naslov' : type === 'subtitle' ? 'Novi podnaslov' : 'Novi tekst...'
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  // Update content block
  const updateContentBlock = (id, content) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  // Delete content block
  const deleteContentBlock = (id) => {
    setContentBlocks(contentBlocks.filter(block => block.id !== id));
  };

  // Save changes
  const saveChanges = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'natjecanja', id);
      await updateDoc(docRef, {
        contentBlocks: contentBlocks
      });
      
      await Swal.fire({
        icon: 'success',
        title: 'Spremljeno!',
        text: 'Promjene su uspješno spremljene',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      // Fallback to localStorage
      const localNatjecanja = JSON.parse(localStorage.getItem('natjecanja') || '[]');
      const updatedNatjecanja = localNatjecanja.map(n => 
        n.id === id ? { ...n, contentBlocks } : n
      );
      localStorage.setItem('natjecanja', JSON.stringify(updatedNatjecanja));
      
      await Swal.fire({
        icon: 'warning',
        title: 'Spremljeno lokalno',
        text: 'Promjene su spremljene lokalno',
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Učitavanje...</div>
      </div>
    );
  }

  if (!natjecanje) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Natjecanje nije pronađeno</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full bg-[#666] shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/natjecanja">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                ← Natrag
              </button>
            </Link>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white">
                III. gimnazija, Split
              </span>
              <span className="text-sm text-white">
                Prirodoslovno-matematička gimnazija
              </span>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white">
            Detalji natjecanja
          </h1>
          
          {isAdmin && (
            <div className="flex items-center gap-2">
              {editMode && (
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
                >
                  {saving ? 'Spremanje...' : 'Spremi promjene'}
                </button>
              )}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded font-medium transition-colors duration-200 ${
                  editMode 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-white text-[#666] hover:bg-[#36b977] hover:text-white'
                }`}
              >
                {editMode ? 'Izađi iz edit moda' : 'Uredi sadržaj'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Competition header */}
        <div className="mb-8">
          {/* Gradient banner */}
          <div
            className="w-full h-64 rounded-lg border border-gray-200 flex items-center justify-center mb-6"
            style={{ 
              background: natjecanje.gradientStyle || getCategoryGradient(natjecanje.kategorija),
            }}
          >
            <div className="text-center text-white">
              <div className="text-4xl font-bold mb-2 drop-shadow-lg">
                {natjecanje.kategorija}
              </div>
              <div className="text-2xl font-medium drop-shadow-md">
                {natjecanje.naziv}
              </div>
            </div>
          </div>
          
          {/* Basic info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-[#666] mb-2">Osnovne informacije</h3>
                <p><strong>Naziv:</strong> {natjecanje.naziv}</p>
                <p><strong>Datum:</strong> {natjecanje.datum}</p>
                <p><strong>Kategorija:</strong> {natjecanje.kategorija}</p>
                {natjecanje.opis && (
                  <p><strong>Opis:</strong> {natjecanje.opis}</p>
                )}
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={handlePrijava}
                  className="bg-[#36b977] text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2 shadow-lg text-lg font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {natjecanje.tipPrijave === 'custom' && natjecanje.prijavaLink ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    )}
                  </svg>
                  Prijavi se na natjecanje
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content blocks */}
        <div className="space-y-4">
          {contentBlocks.map((block, index) => (
            <div key={block.id} className="relative group">
              {editMode && isAdmin && (
                <button
                  onClick={() => deleteContentBlock(block.id)}
                  className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                  title="Obriši blok"
                >
                  ×
                </button>
              )}
              
              {block.type === 'title' && (
                editMode && isAdmin ? (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateContentBlock(block.id, e.target.value)}
                    className="w-full text-3xl font-bold text-[#36b977] border-2 border-dashed border-gray-300 rounded p-2 bg-transparent focus:outline-none focus:border-[#36b977]"
                    placeholder="Unesite naslov..."
                  />
                ) : (
                  <h2 className="text-3xl font-bold text-[#36b977] mb-4">{block.content}</h2>
                )
              )}
              
              {block.type === 'subtitle' && (
                editMode && isAdmin ? (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateContentBlock(block.id, e.target.value)}
                    className="w-full text-2xl font-semibold text-[#666] border-2 border-dashed border-gray-300 rounded p-2 bg-transparent focus:outline-none focus:border-[#36b977]"
                    placeholder="Unesite podnaslov..."
                  />
                ) : (
                  <h3 className="text-2xl font-semibold text-[#666] mb-3">{block.content}</h3>
                )
              )}
              
              {block.type === 'text' && (
                editMode && isAdmin ? (
                  <textarea
                    value={block.content}
                    onChange={(e) => updateContentBlock(block.id, e.target.value)}
                    className="w-full text-gray-700 border-2 border-dashed border-gray-300 rounded p-4 bg-transparent focus:outline-none focus:border-[#36b977] min-h-[100px] resize-vertical"
                    placeholder="Unesite tekst..."
                  />
                ) : (
                  <div className="text-gray-700 mb-4 whitespace-pre-wrap">{block.content}</div>
                )
              )}
            </div>
          ))}
        </div>

        {/* Add content button (only visible to admins in edit mode) */}
        {editMode && isAdmin && (
          <div className="mt-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="flex items-center justify-center gap-4">
              <span className="text-gray-600 font-medium">Dodaj novi sadržaj:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => addContentBlock('title')}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
                >
                  + Naslov
                </button>
                <button
                  onClick={() => addContentBlock('subtitle')}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors duration-200"
                >
                  + Podnaslov
                </button>
                <button
                  onClick={() => addContentBlock('text')}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200"
                >
                  + Tekst
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state for non-admin users when no content */}
        {!editMode && contentBlocks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              Dodatne informacije o natjecanju će biti dodane uskoro.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
