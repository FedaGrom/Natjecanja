"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../contexts/AuthContext";
import Sidebar from "../../components/Sidebar";
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
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // General info form state (edit mode)
  const [generalOpen, setGeneralOpen] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [form, setForm] = useState({
    naziv: '',
    datum: '',
    kategorija: '',
    opis: '',
    tipPrijave: 'web',
    prijavaLink: ''
  });

  // Check if user can edit (admin or creator)
  const canEdit = isAdmin || (user && natjecanje && natjecanje.createdBy === user.email);

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
    const phase = natjecanje?.phase || 'prijave';
    if (phase !== 'prijave') {
      Swal.fire({
        icon: 'info',
        title: 'Prijave su zatvorene',
        text: phase === 'aktivan' 
          ? 'Natjecanje je u tijeku, prijave više nisu moguće.' 
          : 'Natjecanje je završilo, prijave nisu moguće.'
      });
      return;
    }
    if (natjecanje.tipPrijave === 'custom' && natjecanje.prijavaLink) {
      window.open(natjecanje.prijavaLink, '_blank');
    } else {
      // Redirect to application form
      router.push(`/natjecanja/${id}/prijava`);
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

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newBlocks = [...contentBlocks];
    const draggedBlock = newBlocks[draggedItem];
    
    // Remove dragged item
    newBlocks.splice(draggedItem, 1);
    
    // Insert at new position
    const insertIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
    newBlocks.splice(insertIndex, 0, draggedBlock);
    
    setContentBlocks(newBlocks);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
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

  // Status helpers
  const currentPhase = natjecanje?.phase || 'prijave'; // prijave | aktivan | zavrsio
  const phaseLabelMap = {
    prijave: 'Prijave u tijeku',
    aktivan: 'Aktivan',
    zavrsio: 'Završio'
  };
  const phaseColorMap = {
    prijave: 'bg-blue-100 text-blue-700 border-blue-200',
    aktivan: 'bg-amber-100 text-amber-700 border-amber-200',
    zavrsio: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const startCompetition = async () => {
    if (!canEdit || currentPhase === 'aktivan' || currentPhase === 'zavrsio') return;
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Pokreni natjecanje?',
      text: 'Status će se promijeniti u "Aktivan" i zabilježit će se datum početka.',
      showCancelButton: true,
      confirmButtonText: 'Pokreni',
      cancelButtonText: 'Odustani'
    });
    if (!confirm.isConfirmed) return;
    try {
      const ref = doc(db, 'natjecanja', id);
      await updateDoc(ref, {
        phase: 'aktivan',
        startedAt: serverTimestamp(),
        startedBy: user?.email || user?.uid || 'unknown'
      });
      setNatjecanje(prev => ({ ...prev, phase: 'aktivan', startedAt: new Date() }));
      await Swal.fire({ icon: 'success', title: 'Natjecanje je pokrenuto', timer: 1500, showConfirmButton: false });
    } catch (e) {
      console.error('Error starting competition:', e);
      await Swal.fire({ icon: 'error', title: 'Greška', text: 'Nije moguće pokrenuti natjecanje.' });
    }
  };

  const endCompetition = async () => {
    if (!canEdit || currentPhase !== 'aktivan') return;
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Završi natjecanje?',
      text: 'Status će se promijeniti u "Završio" i zabilježit će se datum završetka.',
      showCancelButton: true,
      confirmButtonText: 'Završi',
      cancelButtonText: 'Odustani'
    });
    if (!confirm.isConfirmed) return;
    try {
      const ref = doc(db, 'natjecanja', id);
      await updateDoc(ref, {
        phase: 'zavrsio',
        endedAt: serverTimestamp(),
        endedBy: user?.email || user?.uid || 'unknown'
      });
      setNatjecanje(prev => ({ ...prev, phase: 'zavrsio', endedAt: new Date() }));
      await Swal.fire({ icon: 'success', title: 'Natjecanje je završeno', timer: 1500, showConfirmButton: false });
    } catch (e) {
      console.error('Error ending competition:', e);
      await Swal.fire({ icon: 'error', title: 'Greška', text: 'Nije moguće završiti natjecanje.' });
    }
  };

  // Sync form with loaded competition
  useEffect(() => {
    if (!natjecanje) return;
    setForm({
      naziv: natjecanje.naziv || '',
      datum: natjecanje.datum || '',
      kategorija: natjecanje.kategorija || '',
      opis: natjecanje.opis || '',
      tipPrijave: natjecanje.tipPrijave || 'web',
      prijavaLink: natjecanje.prijavaLink || ''
    });
  }, [natjecanje]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveGeneralInfo = async () => {
    if (!canEdit) return;
    // Basic validation
    if (!form.naziv.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Nedostaje naziv', text: 'Unesite naziv natjecanja.' });
      return;
    }
    if (!form.datum.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Nedostaje datum', text: 'Unesite datum natjecanja.' });
      return;
    }
    if (form.tipPrijave === 'custom' && !form.prijavaLink.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Nedostaje link za prijavu', text: 'Kod prilagođenog načina prijave link je obavezan.' });
      return;
    }

    setSavingGeneral(true);
    try {
      // Compute gradient for known categories; otherwise keep existing
      const known = ['SPORT', 'DRUŠTVENE IGRE TURNIR', 'KVIZOVI', 'GLAZBA', 'OSTALO'];
      const newGradient = known.includes(form.kategorija)
        ? (natjecanje?.gradientStyle || getCategoryGradient(form.kategorija))
        : (natjecanje?.gradientStyle || null);

      const updatePayload = {
        naziv: form.naziv.trim(),
        datum: form.datum.trim(),
        kategorija: form.kategorija.trim(),
        opis: form.opis?.trim() || null,
        tipPrijave: form.tipPrijave,
        prijavaLink: form.tipPrijave === 'custom' ? (form.prijavaLink.trim() || null) : null,
        ...(newGradient ? { gradientStyle: newGradient } : {})
      };

      const ref = doc(db, 'natjecanja', id);
      await updateDoc(ref, updatePayload);

      setNatjecanje((prev) => ({ ...prev, ...updatePayload }));
      await Swal.fire({ icon: 'success', title: 'Osnovni podaci spremljeni', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Error saving general info:', error);
      await Swal.fire({ icon: 'error', title: 'Greška', text: 'Nije moguće spremiti osnovne podatke.' });
    } finally {
      setSavingGeneral(false);
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
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Header */}
      <header className="sticky top-0 w-full bg-[#666] shadow-md border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <img
              src="/slike/logo.jpg.png"
              alt="Logo"
              width={48}
              height={48}
              className="rounded border-2 border-gray-300 shadow bg-white"
            />
            <Link href="/natjecanja">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                Početna
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
          
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span className={`hidden md:inline-block px-2 py-1 rounded border text-xs font-semibold ${phaseColorMap[currentPhase]}`}>
              {phaseLabelMap[currentPhase]}
            </span>
            {canEdit && (
              <>
                {currentPhase === 'prijave' && (
                  <button onClick={startCompetition} className="bg-amber-500 text-white px-3 py-2 rounded hover:bg-amber-600 transition-colors duration-200">
                    Počni natjecanje
                  </button>
                )}
                {currentPhase === 'aktivan' && (
                  <button onClick={endCompetition} className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors duration-200">
                    Završi natjecanje
                  </button>
                )}
              </>
            )}
            {/* Edit controls */}
            {canEdit && (
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
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-6 lg:ml-80">
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
                <p className="mt-2">
                  <strong>Status:</strong>{' '}
                  <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${phaseColorMap[currentPhase]}`}>
                    {phaseLabelMap[currentPhase]}
                  </span>
                </p>
                {(natjecanje.startedAt || currentPhase === 'aktivan') && (
                  <p><strong>Početak:</strong> {natjecanje.startedAt?.toDate ? natjecanje.startedAt.toDate().toLocaleString('hr-HR') : ''}</p>
                )}
                {natjecanje.endedAt && (
                  <p><strong>Završetak:</strong> {natjecanje.endedAt?.toDate ? natjecanje.endedAt.toDate().toLocaleString('hr-HR') : ''}</p>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {(natjecanje?.phase || 'prijave') === 'prijave' ? (
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
                ) : (
                  <button
                    type="button"
                    disabled
                    className="bg-gray-300 text-gray-600 px-8 py-3 rounded-lg cursor-not-allowed transition-colors duration-200 flex items-center gap-2 shadow text-lg font-medium"
                    title="Prijave su zatvorene"
                  >
                    Prijave zatvorene
                  </button>
                )}
                {canEdit && currentPhase === 'prijave' && (
                  <button onClick={startCompetition} className="bg-amber-500 text-white px-4 py-3 rounded hover:bg-amber-600 transition-colors duration-200">
                    Počni natjecanje
                  </button>
                )}
                {canEdit && currentPhase === 'aktivan' && (
                  <button onClick={endCompetition} className="bg-red-500 text-white px-4 py-3 rounded hover:bg-red-600 transition-colors duration-200">
                    Završi natjecanje
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* General info editor (visible in edit mode) */}
        {editMode && canEdit && (
          <div className="mb-6 border-2 border-amber-200 rounded-lg bg-amber-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200">
              <h3 className="text-lg font-bold text-amber-800">Uredi osnovne podatke</h3>
              <button
                onClick={() => setGeneralOpen(!generalOpen)}
                className="text-amber-700 hover:text-amber-900 text-sm"
              >
                {generalOpen ? 'Sakrij' : 'Prikaži'}
              </button>
            </div>
            {generalOpen && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">Naziv *</label>
                  <input
                    name="naziv"
                    type="text"
                    value={form.naziv}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Unesite naziv"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">Datum *</label>
                  <input
                    name="datum"
                    type="text"
                    value={form.datum}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="npr. 2025-03-21"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">Kategorija</label>
                  <input
                    name="kategorija"
                    type="text"
                    value={form.kategorija}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="npr. SPORT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-1">Način prijave</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="tipPrijave"
                        value="web"
                        checked={form.tipPrijave === 'web'}
                        onChange={handleFormChange}
                      />
                      <span>Na webu</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="tipPrijave"
                        value="custom"
                        checked={form.tipPrijave === 'custom'}
                        onChange={handleFormChange}
                      />
                      <span>Vanjski link</span>
                    </label>
                  </div>
                </div>
                {form.tipPrijave === 'custom' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-amber-900 mb-1">Link za prijavu *</label>
                    <input
                      name="prijavaLink"
                      type="url"
                      value={form.prijavaLink}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="https://..."
                    />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-amber-900 mb-1">Opis</label>
                  <textarea
                    name="opis"
                    rows={3}
                    value={form.opis}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-amber-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                    placeholder="Kratki opis natjecanja (opcionalno)"
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      // reset
                      setForm({
                        naziv: natjecanje.naziv || '',
                        datum: natjecanje.datum || '',
                        kategorija: natjecanje.kategorija || '',
                        opis: natjecanje.opis || '',
                        tipPrijave: natjecanje.tipPrijave || 'web',
                        prijavaLink: natjecanje.prijavaLink || ''
                      });
                    }}
                    className="px-4 py-2 rounded border border-amber-200 text-amber-800 bg-white hover:bg-amber-100"
                  >
                    Resetiraj
                  </button>
                  <button
                    onClick={saveGeneralInfo}
                    disabled={savingGeneral}
                    className="px-5 py-2 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {savingGeneral ? 'Spremanje...' : 'Spremi osnovne podatke'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content blocks */}
        <div className="space-y-4">
          {contentBlocks.map((block, index) => (
            <div 
              key={block.id} 
              className={`relative group transition-all duration-200 ${
                editMode && canEdit ? 'cursor-move' : ''
              } ${
                dragOverIndex === index ? 'border-t-4 border-[#36b977] pt-4' : ''
              } ${
                draggedItem === index ? 'opacity-50 scale-95' : ''
              }`}
              draggable={editMode && canEdit}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {editMode && canEdit && (
                <>
                  {/* Drag handle */}
                  <div className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 4a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4z" />
                      <path d="M9 6a1 1 0 000 2h2a1 1 0 100-2H9zM9 10a1 1 0 100 2h2a1 1 0 100-2H9z" />
                    </svg>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => deleteContentBlock(block.id)}
                    className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                    title="Obriši blok"
                  >
                    ×
                  </button>
                </>
              )}
              
              {block.type === 'title' && (
                editMode && canEdit ? (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateContentBlock(block.id, e.target.value)}
                    className="w-full text-3xl font-bold text-[#36b977] border-2 border-dashed border-gray-300 rounded p-2 bg-transparent focus:outline-none focus:border-[#36b977] cursor-text"
                    placeholder="Unesite naslov..."
                    onDragStart={(e) => e.preventDefault()}
                  />
                ) : (
                  <h2 className="text-3xl font-bold text-[#36b977] mb-4">{block.content}</h2>
                )
              )}
              
              {block.type === 'subtitle' && (
                editMode && canEdit ? (
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => updateContentBlock(block.id, e.target.value)}
                    className="w-full text-2xl font-semibold text-[#666] border-2 border-dashed border-gray-300 rounded p-2 bg-transparent focus:outline-none focus:border-[#36b977] cursor-text"
                    placeholder="Unesite podnaslov..."
                    onDragStart={(e) => e.preventDefault()}
                  />
                ) : (
                  <h3 className="text-2xl font-semibold text-[#666] mb-3">{block.content}</h3>
                )
              )}
              
              {block.type === 'text' && (
                editMode && canEdit ? (
                  <textarea
                    value={block.content}
                    onChange={(e) => updateContentBlock(block.id, e.target.value)}
                    className="w-full text-gray-700 border-2 border-dashed border-gray-300 rounded p-4 bg-transparent focus:outline-none focus:border-[#36b977] min-h-[100px] resize-vertical cursor-text"
                    placeholder="Unesite tekst..."
                    onDragStart={(e) => e.preventDefault()}
                  />
                ) : (
                  <div className="text-gray-700 mb-4 whitespace-pre-wrap">{block.content}</div>
                )
              )}
            </div>
          ))}
          
          {/* Drop zone at the end */}
          {editMode && canEdit && contentBlocks.length > 0 && (
            <div 
              className={`h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 transition-all duration-200 ${
                dragOverIndex === contentBlocks.length ? 'border-[#36b977] bg-green-50' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, contentBlocks.length)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, contentBlocks.length)}
            >
              Povucite ovdje za dodavanje na kraj
            </div>
          )}
        </div>

        {/* Add content button (only visible to users who can edit in edit mode) */}
        {editMode && canEdit && (
          <div className="mt-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className="text-gray-600 font-medium">Dodaj novi sadržaj:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => addContentBlock('title')}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Naslov
                </button>
                <button
                  onClick={() => addContentBlock('subtitle')}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Podnaslov
                </button>
                <button
                  onClick={() => addContentBlock('text')}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tekst
                </button>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500 text-center">
              💡 Tip: Povucite blokove gore/dolje da promijenite redoslijed
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
