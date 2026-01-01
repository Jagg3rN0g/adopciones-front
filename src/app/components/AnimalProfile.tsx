"use client";
import { Animal, AnimalSex, AnimalSize, AnimalType } from "../types/animal";
import React, { useState } from "react";
import { useAnimalsStore } from "../store/useAnimalsStore";
import Link from "next/link";
import { VERDE_PRINCIPAL, VERDE_ACENTO, VERDE_GRISACEO, VERDE_MUY_CLARO, BLANCO_HUESO, CASI_NEGRO } from '../../Constants/colors';

type Props = {
    animal: Animal;
    adoptHref?: string;
    showAdoptButton?: boolean;
};

const pretty = {
    type: (t: AnimalType) => (t === "DOG" ? "Perro" : t === "CAT" ? "Gato" : "Otro"),
    sex: (s: AnimalSex) => (s === "MALE" ? "Macho" : s === "FEMALE" ? "Hembra" : "Sin dato"),
    size: (z: AnimalSize) => ({ SMALL: "Chico", MEDIUM: "Mediano", LARGE: "Grande", XL: "XL", UNKNOWN: "Sin dato" }[z]),
    age: (m?: number | null) => (m == null ? "Sin dato" : m < 12 ? `${m} meses` : `${Math.floor(m / 12)} año(s)`),
};

function ImgWithFallback({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
    const [fallbackSrc, setFallbackSrc] = useState(src ?? "/placeholders/placeholder.jpg");
    return (
        <img
            src={fallbackSrc}
            alt={alt}
            className={className}
            onError={() => setFallbackSrc("/placeholders/placeholder.jpg")}
            loading="lazy"
            unoptimized
        />
    );
}

export function AnimalProfile({
    animal,
    onAdopt,
    showAdoptButton = true,
}: {
    animal: Animal;
    onAdopt?: (animal: Animal) => void;
    showAdoptButton?: boolean;
}) {
    const setAnimal = useAnimalsStore((s) => s.setAnimal);
    const btnPrimary =
        "inline-flex items-center justify-center px-5 py-2 rounded-xl text-white font-semibold shadow-sm " +
        "focus:outline-none focus:ring-2 transition";
    const chip =
        "px-2 py-1 text-xs rounded-full border";

    return (
        <>
            <div className="w-full max-w-5xl mx-auto rounded-3xl border border-zinc-200 shadow-xl overflow-hidden" style={{ backgroundColor: BLANCO_HUESO }}>
                <div className="grid md:grid-cols-2">
                    {/* Lado izquierdo: imagen + galería */}
                    <div style={{ background: `linear-gradient(to bottom, ${VERDE_GRISACEO}40, ${BLANCO_HUESO})` }}>
                        <div className="relative">
                            <ImgWithFallback
                                src={animal.imageUrl}
                                alt={animal.name}
                                className="w-full h-80 md:h-[28rem] object-cover"
                            />
                            <div className="absolute left-3 top-3 flex gap-2">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur border border-zinc-200 dark:bg-black/50 dark:border-zinc-700">
                                    {pretty.type(animal.type)}
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur border border-zinc-200 dark:bg:black/50 dark:border-zinc-700">
                                    {pretty.sex(animal.sex)}
                                </span>
                                {animal.size !== "UNKNOWN" && (
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur border border-zinc-200 dark:bg-black/50 dark:border-zinc-700">
                                        {pretty.size(animal.size)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {animal.gallery && animal.gallery.length > 0 && (
                            <div className="flex gap-2 p-3 overflow-x-auto">
                                {animal.gallery.map((g: string, i: number) => (
                                    <ImgWithFallback
                                        key={i}
                                        src={g}
                                        alt={`${animal.name} ${i + 1}`}
                                        className="h-16 w-24 object-cover rounded-lg border transition"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lado derecho: datos */}
                    <div className="p-6 md:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: CASI_NEGRO }}>{animal.name}</h1>
                                <p className="text-sm mt-1" style={{ color: CASI_NEGRO + '99' }}>
                                    Edad: {pretty.age(animal.age_months)}
                                    {animal.breed ? ` · ${animal.breed}` : ""}
                                </p>
                                {animal.location && (
                                    <p className="text-sm" style={{ color: CASI_NEGRO + '99' }}>Ubicación: {animal.location}</p>
                                )}
                            </div>
                        </div>

                        {animal.tags && animal.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {animal.tags.map((t: string, i: number) => (
                                    <span key={i} className={`${chip} transition`} style={{ borderColor: VERDE_GRISACEO, backgroundColor: VERDE_MUY_CLARO, color: CASI_NEGRO }} onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => { e.currentTarget.style.borderColor = VERDE_ACENTO; e.currentTarget.style.backgroundColor = VERDE_ACENTO + '40'; }} onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => { e.currentTarget.style.borderColor = VERDE_GRISACEO; e.currentTarget.style.backgroundColor = VERDE_MUY_CLARO; }}>
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        )}

                        {animal.description && (
                            <p className="mt-5 text-[15px] leading-7" style={{ color: CASI_NEGRO }}>
                                {animal.description}
                            </p>
                        )}

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <Badge label="Vacunado" ok={!!animal.vaccinated} />
                            <Badge label="Desparasitado" ok={!!animal.dewormed} />
                            <Badge label="Castrado" ok={!!animal.castrated} />
                        </div>

                        {showAdoptButton && (
                            <Link
                                href={`/adopt/${animal.id}`}
                                onClick={() => setAnimal(animal)}
                                prefetch={false}
                                className={`${btnPrimary} mt-8 w-full md:w-auto`}
                                style={{ backgroundColor: VERDE_PRINCIPAL }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = VERDE_ACENTO}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = VERDE_PRINCIPAL}
                            >
                                Quiero adoptar
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto mt-6 flex justify-end">
                <Link
                    href="/"
                    prefetch={false}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors"
                    style={{ borderColor: VERDE_GRISACEO, backgroundColor: BLANCO_HUESO + 'B3', color: CASI_NEGRO }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.backgroundColor = VERDE_MUY_CLARO}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.backgroundColor = BLANCO_HUESO + 'B3'}
                >
                    ← Volver al menú
                </Link>
            </div>
        </>
    );
}

function Badge({ label, ok }: { label: string; ok: boolean }) {
    return (
        <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{
                backgroundColor: ok ? '#dcfce7' : VERDE_MUY_CLARO,
                borderColor: ok ? '#bbf7d0' : VERDE_GRISACEO,
                color: CASI_NEGRO
            }}
        >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ok ? '#22c55e' : VERDE_GRISACEO }} />
            <span className="text-sm">{label}</span>
        </div>
    );
}
