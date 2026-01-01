'use client';
import { Animal } from '../types/animal';
import { monthsToFriendly } from '../../lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useAnimalsStore } from '../store/useAnimalsStore';
import { VERDE_PRINCIPAL, VERDE_ACENTO, BLANCO_HUESO, CASI_NEGRO } from '../../Constants/colors';
import React, { useState, useRef } from 'react';
import AnimalProfileModal from './AnimalProfileModal';
import AdoptionFormModal from './AdoptionFormModal';

const PLACEHOLDER_PATH = '/animals/placeholders/placeholder.jpg';

function getGallery(animal: Animal) {
    let imgUrl = animal.imageUrl && animal.imageUrl.trim() !== '' ? animal.imageUrl : PLACEHOLDER_PATH;
    let photoArray = Array.isArray(animal.gallery)
        ? animal.gallery.filter(g => g && g.trim() !== '')
        : [];
    // Si imgUrl está ya en photoArray, no lo duplicar
    if (!photoArray.includes(imgUrl)) {
        photoArray = [imgUrl, ...photoArray];
    }
    if (photoArray.length === 0) {
        photoArray = [PLACEHOLDER_PATH];
    }
    return photoArray;
}

function resolveImageSrc(src: string) {
    if (src.startsWith('http')) return src;
    if (src.startsWith(PLACEHOLDER_PATH)) return src;
    if (src === PLACEHOLDER_PATH) return src;
    return (process.env.NEXT_PUBLIC_IMAGES_URL ?? '') + src;
}

export default function AnimalCard({ animal }: { animal: Animal }) {
    const setAnimal = useAnimalsStore((s) => s.setAnimal);

    const gallery = getGallery(animal);
    const age = animal.age == 1 ? `${animal.age} año` : animal.age! > 1 ? `${animal.age} años` : 'Unknown';
    const [currentIdx, setCurrentIdx] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalIdx, setModalIdx] = useState(0);

    // Nuevo estado para video modal y url del video descargado
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const videoObjectUrlRef = useRef<string | null>(null);

    // Estados para los nuevos modales
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [adoptionModalOpen, setAdoptionModalOpen] = useState(false);

    // Slider navigation
    const nextImage = (e: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setCurrentIdx((prev) => (prev + 1) % gallery.length);
    };
    const prevImage = (e: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setCurrentIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
    };
    const goToImage = (idx: number) => {
        setCurrentIdx(idx);
    };

    // Modal navigation
    const nextModalImage = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) e.stopPropagation();
        setModalIdx((prev) => (prev + 1) % gallery.length);
    };
    const prevModalImage = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) e.stopPropagation();
        setModalIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
    };
    const goToModalImage = (idx: number) => {
        setModalIdx(idx);
    };

    // Modal accessibility
    React.useEffect(() => {
        if (!modalOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setModalOpen(false);
            } else if (e.key === 'ArrowRight') {
                nextModalImage();
            } else if (e.key === 'ArrowLeft') {
                prevModalImage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalOpen, gallery.length]);

    // Video modal accessibility
    React.useEffect(() => {
        if (!videoModalOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setVideoModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [videoModalOpen]);

    // Limpiar blob url cuando se cierra el modal
    React.useEffect(() => {
        if (!videoModalOpen) {
            if (videoObjectUrlRef.current) {
                URL.revokeObjectURL(videoObjectUrlRef.current);
                videoObjectUrlRef.current = null;
            }
            setVideoUrl(null);
            setVideoLoading(false);
        }
    }, [videoModalOpen]);

    // Encuentra el primer video
    const animalVideo = animal?.videos && animal.videos.length > 0 ? animal.videos[0] : null;

    // Verifica si es un enlace de YouTube o similar (externo) 
    const isExternalVideo = (url: string) =>
        url.includes('youtube.com') || url.includes('youtu.be') || url.startsWith('http') && !url.includes('/api/');

    // Maneja la carga del video desde el backend
    const handleOpenVideoModal = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!animalVideo) return;
        if (isExternalVideo(animalVideo)) {
            setVideoUrl(animalVideo);
            setVideoModalOpen(true);
            return;
        }
        // Si es backend, fetch del recurso (suponiendo que ya es una ruta absoluta o relativa del backend)
        setVideoLoading(true);
        setVideoUrl(null);
        setVideoModalOpen(true);
        try {
            // Si la url ya es absoluta, úsala, si no, toma el backend base de .env
            const backendBase = process.env.NEXT_PUBLIC_IMAGES_URL ?? '';
            const absoluteUrl = animalVideo.startsWith('http') ? animalVideo : `${backendBase}${animalVideo}`;
            const res = await fetch(absoluteUrl, {
                method: 'GET',
                // Agregar credentials, headers, auth si hace falta aquí
            });
            if (!res.ok) throw new Error('No se pudo obtener el video');
            const blob = await res.blob();
            // Limpiar urls anteriores
            if (videoObjectUrlRef.current) {
                URL.revokeObjectURL(videoObjectUrlRef.current);
            }
            const objectUrl = URL.createObjectURL(blob);
            videoObjectUrlRef.current = objectUrl;
            setVideoUrl(objectUrl);
        } catch (err) {
            setVideoUrl(null);
        }
        setVideoLoading(false);
    };

    console.log(animal.age);

    return (
        <>
            <article className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition" style={{ backgroundColor: BLANCO_HUESO }}>
                <div
                    className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow cursor-zoom-in"
                    onClick={() => {
                        setModalOpen(true);
                        setModalIdx(currentIdx);
                    }}
                >
                    <Image
                        src={resolveImageSrc(gallery[currentIdx])}
                        alt={animal.name}
                        fill
                        className="object-cover group-hover:scale-105 transition"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={currentIdx === 0}
                        unoptimized
                    />
                    {gallery.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/30 rounded-full p-1 shadow hover:bg-white/90 transition z-10"
                                style={{ border: '1px solid #ccc' }}
                                aria-label="Anterior"
                                tabIndex={0}
                            >
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M13 15l-5-5 5-5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/30 rounded-full p-1 shadow hover:bg-white/90 transition z-10"
                                style={{ border: '1px solid #ccc' }}
                                aria-label="Siguiente"
                                tabIndex={0}
                            >
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 flex gap-1">
                                {gallery.map((g, i) => (
                                    <button
                                        key={i}
                                        aria-label={`Imagen ${i + 1}`}
                                        onClick={(e) => { e.stopPropagation(); goToImage(i); }}
                                        className={`w-2 h-2 rounded-full ${currentIdx === i ? 'bg-emerald-600' : 'bg-white/70 border border-zinc-400'} shadow`}
                                        style={{ transition: 'background 0.2s', outline: 'none' }}
                                        tabIndex={0}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                    <div className="absolute left-2 top-2 flex gap-2">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-black/60 backdrop-blur border border-zinc-200 dark:border-zinc-700">
                            {animal.type === 'DOG' ? 'Perro' : animal.type === 'CAT' ? 'Gato' : 'Otro'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-black/60 backdrop-blur border border-zinc-200 dark:border-zinc-700">
                            {animal.sex === 'MALE' ? 'Macho' : animal.sex === 'FEMALE' ? 'Hembra' : 'Unknown'}
                        </span>
                        {animal.size !== 'UNKNOWN' && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-black/60 backdrop-blur border border-zinc-200 dark:border-zinc-700">
                                {animal.size === 'SMALL' ? 'Pequeño' : animal.size === 'MEDIUM' ? 'Mediano' : animal.size === 'LARGE' ? 'Grande' : 'XL'}
                            </span>
                        )}
                    </div>
                    {animalVideo && (
                        <button
                            title="Ver video"
                            className="absolute right-2 bottom-2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-emerald-700 transition cursor-pointer flex items-center"
                            style={{ boxShadow: "0 1px 8px #1112" }}
                            onClick={handleOpenVideoModal}
                        >
                            <svg width={22} height={22} fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="9" stroke="white" strokeWidth="1.5" fill="none" />
                                <polygon points="8,7 15,10 8,13" fill="white" />
                            </svg>
                            <span className="sr-only">Ver video</span>
                        </button>
                    )}
                </div>

                <div className="p-3">
                    <h3 className="font-bold text-lg leading-tight" style={{ color: CASI_NEGRO }}>{animal.name}</h3>
                    <p className="text-sm" style={{ color: CASI_NEGRO + '99' }}>
                        {age}{animal.breed ? ` · ${animal.breed}` : ''}
                    </p>
                    {animal.location && (
                        <p className="mt-1 text-xs" style={{ color: CASI_NEGRO + '80' }}>{animal.location}</p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            onClick={() => setAdoptionModalOpen(true)}
                            className="px-3 py-2 text-sm rounded-xl text-white font-semibold transition-colors"
                            style={{ backgroundColor: VERDE_PRINCIPAL }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = VERDE_ACENTO}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = VERDE_PRINCIPAL}
                        >
                            Adoptar
                        </button>
                        <button
                            onClick={() => setProfileModalOpen(true)}
                            className="px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                            Ver ficha
                        </button>
                        {animalVideo && (
                            <button
                                className="flex items-center gap-1 px-3 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition"
                                type="button"
                                onClick={handleOpenVideoModal}
                            >
                                <svg width={16} height={16} fill="currentColor" viewBox="0 0 20 20">
                                    <circle cx="10" cy="10" r="9" stroke="black" strokeWidth="1.5" fill="none" />
                                    <polygon points="8,7 15,10 8,13" fill="black" />
                                </svg>
                                Video
                            </button>
                        )}
                    </div>
                </div>
            </article>

            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setModalOpen(false)}
                    style={{ cursor: 'zoom-out' }}
                >
                    {/* Modal Dialog */}
                    <div
                        className="relative max-w-3xl w-[92vw] md:w-[650px] bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-lg p-0"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="absolute right-3 top-3 z-30 text-2xl bg-white/80 dark:bg-zinc-900/70 rounded-full p-1 border border-zinc-300 dark:border-zinc-700 hover:bg-white/90 dark:hover:bg-zinc-800 transition"
                            onClick={() => setModalOpen(false)}
                            aria-label="Cerrar"
                        >
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path d="M18 6L6 18" stroke="#222" strokeWidth="2" strokeLinecap="round" />
                                <path d="M6 6l12 12" stroke="#222" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                        <div className="relative w-full h-[55vw] md:h-[410px] flex items-center justify-center bg-black/30">
                            <Image
                                src={resolveImageSrc(gallery[modalIdx])}
                                alt={animal.name}
                                fill
                                className="object-contain rounded-2xl"
                                sizes="(max-width: 768px) 92vw, 650px"
                                priority={true}
                                style={{ background: "#181818" }}
                                unoptimized
                            />
                            {gallery.length > 1 && (
                                <>
                                    <button
                                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 dark:bg-zinc-900/80 rounded-full p-2 shadow z-20 border border-zinc-400 hover:bg-white"
                                        style={{ transition: 'background 0.1s' }}
                                        aria-label="Anterior"
                                        onClick={prevModalImage}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M13 15l-5-5 5-5" stroke="#222" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </button>
                                    <button
                                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 dark:bg-zinc-900/80 rounded-full p-2 shadow z-20 border border-zinc-400 hover:bg-white"
                                        style={{ transition: 'background 0.1s' }}
                                        aria-label="Siguiente"
                                        onClick={nextModalImage}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="#222" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex gap-1">
                                        {gallery.map((g, i) => (
                                            <button
                                                key={i}
                                                aria-label={`Imagen ${i + 1}`}
                                                onClick={() => goToModalImage(i)}
                                                className={`w-3 h-3 rounded-full ${modalIdx === i ? 'bg-emerald-600' : 'bg-white/70 border border-zinc-400'} shadow`}
                                                style={{ transition: 'background 0.2s', outline: 'none' }}
                                                tabIndex={0}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                        </div>
                        {gallery.length > 1 && (
                            <div className="flex justify-center mt-2 mb-2">
                                <span className="text-xs text-zinc-700 dark:text-zinc-300">
                                    {modalIdx + 1}/{gallery.length}
                                </span>
                            </div>
                        )}
                        {/* Modal Caption */}
                        <div className="p-3 pb-4 text-center">
                            <h3 className="font-bold text-lg" style={{ color: CASI_NEGRO }}>{animal.name}</h3>
                            <p className="text-xs mt-1" style={{ color: CASI_NEGRO + '99' }}>
                                {age}{animal.breed ? ` · ${animal.breed}` : ''}
                            </p>
                            {animal.location && (
                                <p className="text-xs mt-1" style={{ color: CASI_NEGRO + '80' }}>{animal.location}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para el video */}
            {videoModalOpen && animalVideo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setVideoModalOpen(false)}
                    style={{ cursor: 'zoom-out' }}
                >
                    <div
                        className="relative max-w-3xl w-[92vw] md:w-[650px] bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-lg"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="absolute right-3 top-3 z-30 text-2xl bg-white/80 dark:bg-zinc-900/70 rounded-full p-1 border border-zinc-300 dark:border-zinc-700 hover:bg-white/90 dark:hover:bg-zinc-800 transition"
                            onClick={() => setVideoModalOpen(false)}
                            aria-label="Cerrar"
                        >
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path d="M18 6L6 18" stroke="#222" strokeWidth="2" strokeLinecap="round" />
                                <path d="M6 6l12 12" stroke="#222" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                        <div className="p-0 relative w-full h-[55vw] md:h-[410px] flex items-center justify-center bg-black/80">
                            {/* Mostrar video según el tipo */}
                            {!isExternalVideo(animalVideo)
                                ? videoLoading
                                    ? (
                                        <div className="flex flex-col items-center justify-center w-full h-full">
                                            <span className="text-white text-lg">Cargando video...</span>
                                        </div>
                                    )
                                    : videoUrl
                                        ? (
                                            <video
                                                className="w-full h-full rounded-2xl object-contain max-h-[410px]"
                                                controls
                                                src={videoUrl}
                                                autoPlay
                                            >
                                                Tu navegador no soporta video.
                                            </video>
                                        )
                                        : (
                                            <div className="flex flex-col items-center justify-center w-full h-full">
                                                <span className="text-white text-lg">No se pudo cargar el video.</span>
                                            </div>
                                        )
                                : (
                                    animalVideo.includes('youtube.com') || animalVideo.includes('youtu.be') ? (
                                        <iframe
                                            src={
                                                animalVideo.includes('embed')
                                                    ? animalVideo
                                                    : (
                                                        animalVideo.includes('youtu.be')
                                                            ? `https://www.youtube.com/embed/${animalVideo.split('youtu.be/')[1].split(/[?&]/)[0]}`
                                                            : animalVideo.replace('watch?v=', 'embed/')
                                                    )
                                            }
                                            title="Video"
                                            allow="autoplay; encrypted-media"
                                            allowFullScreen
                                            className="w-full h-full rounded-2xl"
                                            style={{ border: 0 }}
                                        />
                                    ) : (
                                        <video
                                            className="w-full h-full rounded-2xl object-contain max-h-[410px]"
                                            controls
                                            src={animalVideo}
                                            autoPlay
                                        >
                                            Tu navegador no soporta video.
                                        </video>
                                    )
                                )
                            }
                        </div>
                        {/* Modal Caption */}
                        <div className="p-3 pb-4 text-center">
                            <h3 className="font-bold text-lg" style={{ color: CASI_NEGRO }}>{animal.name}</h3>
                            <p className="text-xs mt-1" style={{ color: CASI_NEGRO + '99' }}>
                                {age}{animal.breed ? ` · ${animal.breed}` : ''}
                            </p>
                            {animal.location && (
                                <p className="text-xs mt-1" style={{ color: CASI_NEGRO + '80' }}>{animal.location}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de perfil del animal */}
            <AnimalProfileModal
                animal={animal}
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                onAdopt={() => {
                    setProfileModalOpen(false);
                    setAdoptionModalOpen(true);
                }}
            />

            {/* Modal de formulario de adopción */}
            <AdoptionFormModal
                animal={animal}
                isOpen={adoptionModalOpen}
                onClose={() => setAdoptionModalOpen(false)}
            />
        </>
    );
}