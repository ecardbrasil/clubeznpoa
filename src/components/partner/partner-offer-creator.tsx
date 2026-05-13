"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { readFileAsDataUrl } from "@/lib/partner/utils";

interface PartnerOfferCreatorProps {
  companyId: string;
  availableNeighborhoods: string[];
  availableOfferCategories: string[];
  defaultCategories: string[];
  isPublishing: boolean;
  onSubmit: (payload: {
    title: string;
    description: string;
    discountLabel: string;
    category: string;
    neighborhood: string;
    images: string[];
  }) => Promise<string | null>;
}

export function PartnerOfferCreator({
  companyId,
  availableNeighborhoods,
  availableOfferCategories,
  defaultCategories,
  isPublishing,
  onSubmit,
}: PartnerOfferCreatorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [neighborhood, setNeighborhood] = useState(availableNeighborhoods[0] ?? "");
  const [images, setImages] = useState<string[]>([]);
  const [imageFeedback, setImageFeedback] = useState("");
  const [feedback, setFeedback] = useState("");

  const filteredCategorySuggestions = availableOfferCategories.filter((item) => {
    if (selectedCategories.includes(item)) return false;
    if (!categorySearch.trim()) return true;
    return item.toLowerCase().includes(categorySearch.toLowerCase());
  });

  const addCategoryFromSearch = () => {
    const normalized = categorySearch.trim();
    if (!normalized) return;
    if (selectedCategories.includes(normalized)) {
      setCategorySearch("");
      return;
    }
    setSelectedCategories((current) => [...current, normalized]);
    setCategorySearch("");
  };

  const toggleCategorySelection = (item: string) => {
    setSelectedCategories((current) =>
      current.includes(item) ? current.filter((c) => c !== item) : [...current, item],
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFeedback("");
    setImageFeedback("");

    const missing: string[] = [];
    if (!title.trim()) missing.push("Título");
    if (!description.trim()) missing.push("Descrição");
    if (!discountLabel.trim()) missing.push("Chamada do desconto");
    if (selectedCategories.length === 0) missing.push("Categoria");
    if (!neighborhood.trim()) missing.push("Bairro");
    if (images.length === 0) missing.push("Fotos da oferta");

    if (missing.length > 0) {
      const msg = `Complete: ${missing.join(", ")}.`;
      setFeedback(msg);
      return;
    }

    const error = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      discountLabel: discountLabel.trim(),
      category: selectedCategories[0],
      neighborhood: neighborhood.trim(),
      images,
    });

    if (error) {
      setFeedback(error);
    } else {
      setTitle("");
      setDescription("");
      setDiscountLabel("");
      setSelectedCategories([]);
      setCategorySearch("");
      setImages([]);
      setImageFeedback("");
      setFeedback("Oferta criada com sucesso.");
    }
  };

  const onSelectImages = async (event: ChangeEvent<HTMLInputElement>) => {
    setImageFeedback("");
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) return;

    const remainingSlots = Math.max(0, 5 - images.length);
    const filesToRead = selectedFiles.slice(0, remainingSlots);

    if (filesToRead.length < selectedFiles.length) {
      setImageFeedback("Limite máximo de 5 fotos por oferta.");
    }

    try {
      const encodedImages = await Promise.all(filesToRead.map((file) => readFileAsDataUrl(file)));
      setImages((current) => [...current, ...encodedImages].slice(0, 5));
    } catch {
      setImageFeedback("Não foi possível processar uma das imagens.");
    }
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const setCoverImageFromOffer = (index: number) => {
    setImages((current) => {
      if (index <= 0 || index >= current.length) return current;
      const selected = current[index];
      const remaining = current.filter((_, i) => i !== index);
      return [selected, ...remaining];
    });
  };

  return (
    <section className="card grid gap-2.5">
      <div className="flex items-center gap-2">
        <PlusCircle size={20} className="text-[var(--brand)]" />
        <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
          Cadastrar nova oferta
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-2">
        <label className="field">
          <span>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label className="field">
          <span>Descrição</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
        </label>

        <label className="field">
          <span>Chamada do desconto</span>
          <input value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)} placeholder="Ex.: 20% OFF" required />
        </label>

        <div className="grid gap-2">
          <label className="field">
            <span>Categoria (multi seleção)</span>
            <input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Busque e selecione categorias"
            />
          </label>

          <div className="flex flex-wrap gap-1.5">
            {selectedCategories.map((item) => (
              <button
                key={`selected-${item}`}
                type="button"
                className="badge badge-ok"
                onClick={() => toggleCategorySelection(item)}
                title="Clique para remover"
              >
                {item} ×
              </button>
            ))}
            {selectedCategories.length === 0 && (
              <span className="text-xs text-[var(--muted)]">Nenhuma categoria selecionada.</span>
            )}
          </div>

          <div className="grid gap-1 rounded-xl border border-[#dce8de] bg-white p-2">
            {filteredCategorySuggestions.slice(0, 10).map((item) => (
              <label key={`option-${item}`} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(item)}
                  onChange={() => toggleCategorySelection(item)}
                />
                <span>{item}</span>
              </label>
            ))}
            {filteredCategorySuggestions.length === 0 && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                Nenhuma categoria encontrada para esta busca.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost !w-auto !px-3 !py-1.5"
              onClick={addCategoryFromSearch}
              disabled={!categorySearch.trim()}
            >
              Adicionar categoria nova
            </button>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              A primeira categoria será a principal.
            </p>
          </div>
        </div>

        <label className="field">
          <span>Bairro</span>
          <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required>
            {availableNeighborhoods.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Fotos da oferta (até 5)</span>
          <input accept="image/*" multiple onChange={onSelectImages} type="file" />
        </label>

        {imageFeedback && <p style={{ margin: 0, color: "var(--warn)", fontWeight: 700 }}>{imageFeedback}</p>}

        {images.length > 0 && (
          <div className="grid gap-2">
            <strong>Pré-visualização ({images.length}/5)</strong>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {images.map((imageSrc, index) => (
                <article key={imageSrc.slice(0, 40) + index} className="card grid gap-1.5 p-2">
                  <Image
                    alt={`Foto ${index + 1}`}
                    height={90}
                    src={imageSrc}
                    unoptimized
                    width={180}
                    style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }}
                  />
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: index === 0 ? "var(--brand-2)" : "var(--muted)" }}>
                    {index === 0 ? "Foto de capa" : `Foto ${index + 1}`}
                  </p>
                  <div className="grid gap-1">
                    {index > 0 && (
                      <button className="btn btn-ghost !py-1.5 !px-2" onClick={() => setCoverImageFromOffer(index)} type="button">
                        Definir como capa
                      </button>
                    )}
                    <button className="btn btn-ghost !py-1.5 !px-2" onClick={() => removeImage(index)} type="button">
                      Remover
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={isPublishing}>
          {isPublishing ? "Criando oferta..." : "Criar oferta"}
        </button>
      </form>

      {feedback && (
        <p style={{ margin: 0, fontWeight: 700, color: feedback.includes("sucesso") ? "var(--success-text)" : "var(--error-text)" }}>
          {feedback}
        </p>
      )}
    </section>
  );
}