'use client';

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Animal } from "../types/animal";
import { VERDE_PRINCIPAL, VERDE_ACENTO, VERDE_MUY_CLARO, BLANCO_HUESO, CASI_NEGRO, VERDE_GRISACEO } from '../../Constants/colors';

const schema = z.object({
    animalId: z.union([z.string(), z.number()]),
    fullName: z.string().min(2, "Ingresá tu nombre completo"),
    email: z.string().email("Email inválido"),
    phone: z.string().regex(/^\+?[0-9\s()-]{7,}$/, "Teléfono inválido"),
    city: z.string().min(1, "Campo requerido"),
    province: z.string().min(1, "Campo requerido"),
    housingType: z.enum(["HOUSE", "APARTMENT", "COUNTRY", "OTHER"]),
    hasOtherPets: z.boolean(),
    message: z.string().optional(),
    acceptTerms: z.literal(true, { message: "Debes aceptar los términos" }),
});

export type AdoptionFormData = z.infer<typeof schema>;

export function AdoptionForm({
    animal,
    onSubmit,
    isSubmitting = false,
}: {
    animal: Animal;
    onSubmit: (data: AdoptionFormData) => void | Promise<void>;
    isSubmitting?: boolean;
}) {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<AdoptionFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            animalId: animal.id,
            fullName: "",
            email: "",
            phone: "",
            city: "",
            province: "",
            housingType: "HOUSE",
            hasOtherPets: false,
            message: "",
            acceptTerms: true,
        },
        mode: "onSubmit",
    });

    const inputClass =
        "w-full rounded-xl border border-zinc-300 " +
        "px-3 py-2 text-sm shadow-sm " +
        "outline-none focus:ring-2 " +
        "placeholder:text-zinc-400 disabled:opacity-60";
    const btnGhost =
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl border " +
        "transition";
    const btnPrimary =
        "px-5 py-2 rounded-xl text-white font-semibold " +
        "shadow-sm disabled:opacity-60";
    const btnOutline =
        "px-4 py-2 rounded-xl border transition-colors";

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-2xl mx-auto rounded-2xl border border-zinc-200 shadow-lg"
            style={{ backgroundColor: BLANCO_HUESO }}
        >
            {/* Barra superior con botón Volver */}
            <div className="flex items-center justify-between px-6 pt-4">
                <button type="button" onClick={() => router.back()} className={btnGhost} aria-label="Volver" style={{ borderColor: VERDE_GRISACEO, backgroundColor: BLANCO_HUESO + '99' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = VERDE_MUY_CLARO} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BLANCO_HUESO + '99'}>
                    <span>←</span>
                    <span className="hidden sm:inline">Volver</span>
                </button>
            </div>

            {/* Header del formulario */}
            <header className="m-6 mt-3 rounded-xl border border-zinc-200 p-4 flex items-center gap-4" style={{ background: `linear-gradient(to right, ${VERDE_MUY_CLARO}, ${BLANCO_HUESO})` }}>
                <Image
                    src={animal.imageUrl || "/animals/placeholders/placeholder.jpg"}
                    alt={animal.name}
                    className="h-16 w-20 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                    width={80}
                    height={80}
                    unoptimized
                />
                <div>
                    <h2 className="text-xl font-semibold leading-tight" style={{ color: CASI_NEGRO }}>Formulario de adopción</h2>
                    <p className="text-sm" style={{ color: CASI_NEGRO + '99' }}>
                        Postulación para: <span className="font-medium">{animal.name}</span>
                    </p>
                </div>
            </header>

            {/* Campos */}
            <div className="px-6 pb-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Nombre y apellido" error={errors.fullName?.message}>
                        <input className={inputClass} {...register("fullName")} placeholder="Ej: María Pérez" style={{ backgroundColor: BLANCO_HUESO, color: CASI_NEGRO, borderColor: VERDE_GRISACEO }} />
                    </Field>

                    <Field label="Email" error={errors.email?.message}>
                        <input className={inputClass} type="email" {...register("email")} placeholder="tu@mail.com" />
                    </Field>

                    <Field label="Teléfono" error={errors.phone?.message}>
                        <input className={inputClass} {...register("phone")} placeholder="+54 9 11 2222-3333" />
                    </Field>

                    <Field label="Ciudad" error={errors.city?.message}>
                        <input className={inputClass} {...register("city")} placeholder="CABA" />
                    </Field>

                    <Field label="Provincia" error={errors.province?.message}>
                        <input className={inputClass} {...register("province")} placeholder="Buenos Aires" />
                    </Field>

                    <Field label="Tipo de vivienda">
                        <select className={inputClass} {...register("housingType")}>
                            <option value="HOUSE">Casa</option>
                            <option value="APARTMENT">Departamento</option>
                            <option value="COUNTRY">Quinta/Chacra</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </Field>
                </div>

                <Field label="¿Tenés otras mascotas?">
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" {...register("hasOtherPets")} className="h-4 w-4" />
                        <span>Sí</span>
                    </label>
                </Field>

                <Field label="Contanos por qué querés adoptar (opcional)">
                    <textarea
                        className={`${inputClass} min-h-28`}
                        {...register("message")}
                        placeholder="Motivación, experiencia, espacio, etc."
                    />
                </Field>

                <Field error={errors.acceptTerms?.message}>
                    <label className="inline-flex items-start gap-2 text-sm">
                        <input type="checkbox" {...register("acceptTerms")} className="mt-1 h-4 w-4" />
                        <span>
                            Acepto los términos y condiciones y autorizo el uso de mis datos para gestionar la adopción.
                        </span>
                    </label>
                </Field>

                {/* Acciones */}
                <div className="flex gap-3 justify-end pt-2">
                    <button type="button" className={btnOutline} onClick={() => reset()} style={{ borderColor: VERDE_GRISACEO, color: CASI_NEGRO }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = VERDE_MUY_CLARO} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Limpiar
                    </button>
                    <button type="submit" disabled={isSubmitting} className={btnPrimary} style={{ backgroundColor: VERDE_PRINCIPAL }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = VERDE_ACENTO} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = VERDE_PRINCIPAL}>
                        {isSubmitting ? "Enviando…" : "Enviar solicitud"}
                    </button>
                </div>
            </div>
        </form>
    );
}

function Field({ label, error, children }: { label?: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            {label && <label className="block text-sm font-medium mb-1" style={{ color: CASI_NEGRO }}>{label}</label>}
            {children}
            {error && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{error}</p>}
        </div>
    );
}
