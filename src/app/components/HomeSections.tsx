'use client';

import { useSections } from '@/hooks/useSections';
import { VERDE_PRINCIPAL, CASI_NEGRO } from '@/Constants/colors';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const backendBase = process.env.NEXT_PUBLIC_IMAGES_URL ?? '';

function resolveSectionImageUrl(url: string) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${backendBase}${url}`;
}

function SectionCarousel({ images, alt }: { images: string[]; alt: string }) {
    const [index, setIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startAutoPlay = () => {
        if (!images || images.length <= 1 || isPaused) return;
        intervalRef.current = setInterval(() => {
            goToNext();
        }, 5500); // Más lento: 5.5 segundos
    };

    const stopAutoPlay = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const goToNext = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setIndex(prev => (prev + 1) % images.length);
        setTimeout(() => setIsTransitioning(false), 600);
    };

    const goToPrev = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setIndex(prev => (prev - 1 + images.length) % images.length);
        setTimeout(() => setIsTransitioning(false), 600);
    };

    const goToSlide = (slideIndex: number) => {
        if (isTransitioning || slideIndex === index) return;
        setIsTransitioning(true);
        setIndex(slideIndex);
        setTimeout(() => setIsTransitioning(false), 600);
    };

    useEffect(() => {
        startAutoPlay();
        return () => stopAutoPlay();
    }, [images, isPaused]);

    // When images or length changes, reset carousel
    useEffect(() => {
        setIndex(0);
        setIsTransitioning(false);
    }, [images && images.join(',')]);

    if (!images || images.length === 0) return null;

    if (images.length === 1) {
        return (
            <div className="relative h-80 mb-6 rounded-xl overflow-hidden">
                <Image
                    src={resolveSectionImageUrl(images[0])}
                    alt={alt}
                    fill
                    className="object-cover"
                    unoptimized
                />
            </div>
        );
    }

    return (
        <div
            className="relative h-80 mb-6 rounded-xl overflow-hidden group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Imagen actual */}
            <div className="relative w-full h-full">
                <Image
                    key={`current-${index}`}
                    src={resolveSectionImageUrl(images[index])}
                    alt={alt}
                    fill
                    className={`object-cover transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                        }`}
                    priority={index === 0}
                    unoptimized
                />
            </div>

            {/* Botón anterior */}
            <button
                onClick={goToPrev}
                disabled={isTransitioning}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Imagen anterior"
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {/* Botón siguiente */}
            <button
                onClick={goToNext}
                disabled={isTransitioning}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Imagen siguiente"
            >
                <ChevronRightIcon className="w-5 h-5" />
            </button>

            {/* Indicadores */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goToSlide(i)}
                        disabled={isTransitioning}
                        className={`block w-3 h-3 rounded-full border-2 border-white transition-all duration-300 hover:scale-110 disabled:cursor-not-allowed ${i === index
                            ? 'bg-emerald-600 border-emerald-600'
                            : 'bg-white/60 hover:bg-white/80'
                            }`}
                        aria-label={`Ir a imagen ${i + 1}`}
                    />
                ))}
            </div>

            {/* Indicador de pausa */}
            {isPaused && (
                <div className="absolute top-3 right-3 z-10 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    Pausado
                </div>
            )}
        </div>
    );
}

export default function HomeSections() {
    const { data: sections, isLoading, isError } = useSections();

    if (isLoading) {
        return (
            <section className="space-y-8 w-full px-0">
                <div className="space-y-8 w-full">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 animate-pulse w-full">
                            <div className="h-8 bg-gray-200 rounded mb-6"></div>
                            <div className="h-80 bg-gray-200 rounded mb-6"></div>
                            <div className="space-y-3">
                                <div className="h-5 bg-gray-200 rounded"></div>
                                <div className="h-5 bg-gray-200 rounded w-4/5"></div>
                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (isError || !sections || sections.length === 0) {
        return null;
    }

    return (
        <section className="space-y-8 w-full px-0">
            <div className="space-y-8 w-full">
                {sections.slice(0, 4).map((section) => (
                    <div
                        key={section.id}
                        id={`section-${section.id}`}
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 hover:shadow-xl transition-all duration-300 w-full min-h-[600px] scroll-mt-20"
                    >
                        <h3 className="text-2xl font-bold mb-6" style={{ color: VERDE_PRINCIPAL }}>
                            {section.title}
                        </h3>

                        {section.images && section.images.length > 0 && (
                            <SectionCarousel images={section.images} alt={section.title} />
                        )}

                        <div
                            className="text-base leading-relaxed"
                            style={{ color: CASI_NEGRO + '99' }}
                            dangerouslySetInnerHTML={{ __html: section.description }}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
