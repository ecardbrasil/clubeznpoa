"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Image from "next/image";
import { UserCog } from "lucide-react";
import { DEFAULT_CATEGORIES, parseCategories, serializeCategories } from "@/lib/categories";

export function PartnerProfileEditor({
  effectivePublicName,
  effectiveAddressLine,
  effectiveHasPhysicalAddress,
  effectiveBio,
  effectiveInstagram,
  effectiveFacebook,
  effectiveWebsite,
  effectiveWhatsapp,
  effectiveLogoImage,
  effectiveCoverImage,
  effectiveProfileCategories,
  onSave,
  feedback,
}: {
  effectivePublicName: string;
  effectiveAddressLine: string;
  effectiveHasPhysicalAddress: boolean;
  effectiveBio: string;
  effectiveInstagram: string;
  effectiveFacebook: string;
  effectiveWebsite: string;
  effectiveWhatsapp: string;
  effectiveLogoImage: string;
  effectiveCoverImage: string;
  effectiveProfileCategories: string[];
  onSave: (payload: {
    publicName: string;
    addressLine: string;
    hasPhysicalAddress: boolean;
    bio: string;
    instagram: string;
    facebook: string;
    website: string;
    whatsapp: string;
    logoImage: string;
    coverImage: string;
    categories: string[];
  }) => Promise<void>;
  feedback: string;
}) {
  const [publicName, setPublicName] = useState(effectivePublicName);
  const [hasPhysicalAddress, setHasPhysicalAddress] = useState(effectiveHasPhysicalAddress);
  const [addressLine, setAddressLine] = useState(effectiveAddressLine);
  const [bio, setBio] = useState(effectiveBio);
  const [instagram, setInstagram] = useState(effectiveInstagram);
  const [facebook, setFacebook] = useState(effectiveFacebook);
  const [website, setWebsite] = useState(effectiveWebsite);
  const [whatsapp, setWhatsapp] = useState(effectiveWhatsapp);
  const [logoImage, setLogoImage] = useState(effectiveLogoImage);
  const [coverImage, setCoverImage] = useState(effectiveCoverImage);
  const [categories, setCategories] = useState(effectiveProfileCategories);
  const [categorySearch, setCategorySearch] = useState("");

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({
      publicName: publicName.trim(),
      addressLine: hasPhysicalAddress ? addressLine.trim() : "",
      hasPhysicalAddress,
      bio: bio.trim(),
      instagram: instagram.trim(),
      facebook: facebook.trim(),
      website: website.trim(),
      whatsapp: whatsapp.trim(),
      logoImage,
      coverImage,
      categories,
    });
  };

  const onSelectProfileImage = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: "logo" | "cover",
  ) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    try {
      const reader = new FileReader();
      const encoded = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Falha ao carregar imagem."));
        reader.readAsDataURL(selectedFile);
      });
      if (kind === "logo") setLogoImage(encoded);
      if (kind === "cover") setCoverImage(encoded);
    } catch {
      // Silently fail - user can try again
    }
  };

  const filteredCategories = DEFAULT_CATEGORIES.filter((item) => {
    if (categories.includes(item)) return false;
    if (!categorySearch.trim()) return true;
    return item.toLowerCase().includes(categorySearch.toLowerCase());
  }).slice(0, 10);

  return (
    <section className="grid gap-2.5">
      {/* Social media header: capa + avatar */}
      <div
        style={{
          position: "relative",
          borderRadius: 14,
          overflow: "hidden",
          background: coverImage ? "transparent" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          minHeight: 200,
        }}
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt="Capa da empresa"
            width={1200}
            height={300}
            unoptimized
            style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: 200, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }} />
        )}

        <div
          style={{
            position: "absolute",
            bottom: -44,
            left: 24,
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "4px solid #fff",
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            background: logoImage ? "transparent" : "#e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {logoImage ? (
            <Image
              src={logoImage}
              alt="Logo"
              width={96}
              height={96}
              unoptimized
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#aaa">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
      </div>

      <div style={{ paddingLeft: 132, marginTop: 4 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
          {publicName || "Sua empresa"}
        </h2>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>Perfil público da empresa</p>
      </div>

      <div className="card grid gap-2.5" style={{ marginTop: 20 }}>
        <div className="flex items-center gap-2">
          <UserCog size={20} className="text-[var(--brand)]" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f1a13" }}>Editar perfil público</h3>
        </div>

        <form onSubmit={handleSave} className="grid gap-2">
          <label className="field">
            <span>Nome público</span>
            <input
              value={publicName}
              onChange={(e) => setPublicName(e.target.value)}
              placeholder="Nome que aparecerá para os clientes"
              required
            />
          </label>

          <label className="field">
            <span>Endereço físico</span>
            <select
              value={hasPhysicalAddress ? "yes" : "no"}
              onChange={(e) => {
                const has = e.target.value === "yes";
                setHasPhysicalAddress(has);
                if (!has) setAddressLine("");
              }}
            >
              <option value="yes">Tenho endereço físico</option>
              <option value="no">Não tenho endereço físico</option>
            </select>
          </label>

          {hasPhysicalAddress && (
            <label className="field">
              <span>Endereço</span>
              <input
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
              />
            </label>
          )}

          <label className="field">
            <span>Descrição</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Como a empresa quer se apresentar ao público"
            />
          </label>

          <div className="grid gap-2">
            <label className="field">
              <span>Categorias</span>
              <input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Busque e selecione categorias"
              />
            </label>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((item) => (
                <button
                  key={`selected-${item}`}
                  type="button"
                  className="badge badge-ok"
                  onClick={() => setCategories((c) => c.filter((x) => x !== item))}
                  title="Clique para remover"
                >
                  {item} ×
                </button>
              ))}
              {categories.length === 0 && (
                <span className="text-xs text-[var(--muted)]">Nenhuma categoria selecionada.</span>
              )}
            </div>

            {categorySearch.trim() && (
              <div className="grid gap-1 rounded-xl border border-[#dce8de] bg-white p-2">
                {filteredCategories.map((item) => (
                  <label key={`option-${item}`} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={categories.includes(item)}
                      onChange={() =>
                        setCategories((c) =>
                          c.includes(item) ? c.filter((x) => x !== item) : [...c, item],
                        )
                      }
                    />
                    <span>{item}</span>
                  </label>
                ))}
                {filteredCategories.length === 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    Nenhuma categoria encontrada.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="field">
              <span>Instagram</span>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@suaempresa"
              />
            </label>
            <label className="field">
              <span>Facebook</span>
              <input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="facebook.com/suaempresa"
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="field">
              <span>Site</span>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </label>
            <label className="field">
              <span>WhatsApp</span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="51999990000"
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="field">
              <span>Logomarca (foto de perfil)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onSelectProfileImage(e, "logo")}
              />
            </label>
            <label className="field">
              <span>Foto de capa</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onSelectProfileImage(e, "cover")}
              />
            </label>
          </div>

          {(logoImage || coverImage) && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="card grid gap-1.5 p-2">
                <strong style={{ fontSize: 13 }}>Logomarca</strong>
                {logoImage ? (
                  <>
                    <Image
                      src={logoImage}
                      alt="Pré-visualização da logomarca"
                      width={240}
                      height={120}
                      unoptimized
                      style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost !py-1.5 !px-2"
                      onClick={() => setLogoImage("")}
                    >
                      Remover logomarca
                    </button>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Sem logomarca.</p>
                )}
              </div>
              <div className="card grid gap-1.5 p-2">
                <strong style={{ fontSize: 13 }}>Capa</strong>
                {coverImage ? (
                  <>
                    <Image
                      src={coverImage}
                      alt="Pré-visualização da capa"
                      width={320}
                      height={120}
                      unoptimized
                      style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost !py-1.5 !px-2"
                      onClick={() => setCoverImage("")}
                    >
                      Remover capa
                    </button>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Sem capa.</p>
                )}
              </div>
            </div>
          )}

          <button className="btn btn-primary" type="submit">
            Salvar perfil público
          </button>
        </form>

        {feedback && <p style={{ margin: 0, fontWeight: 700 }}>{feedback}</p>}
      </div>
    </section>
  );
}