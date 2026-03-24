"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PartnerDashboardSidebar, PartnerSection } from "@/components/partner/dashboard-sidebar";
import { useToast } from "@/components/ui/toast";
import { AppData, Offer } from "@/lib/types";
import {
  clearSession,
  createOffer,
  getCurrentUser,
  getData,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  routeByRole,
  syncRedemptionExpirations,
  updateCompanyProfile,
  validateCode,
} from "@/lib/storage";

const formatDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Falha ao carregar imagem."));
    reader.readAsDataURL(file);
  });

type RedemptionFilter = "all" | "generated" | "used" | "expired";

export default function PartnerPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [section, setSection] = useState<PartnerSection>("overview");
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");
  const [offerFeedback, setOfferFeedback] = useState("");
  const [profileFeedback, setProfileFeedback] = useState("");
  const [redemptionFilter, setRedemptionFilter] = useState<RedemptionFilter>("all");
  const [nowTimestamp, setNowTimestamp] = useState(0);

  const user = getCurrentUser();
  const [data, setData] = useState<AppData | null>(() => {
    syncRedemptionExpirations();
    return getData();
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [category, setCategory] = useState("");
  const [neighborhood, setNeighborhood] = useState("Sarandi");
  const [images, setImages] = useState<string[]>([]);
  const [imageFeedback, setImageFeedback] = useState("");

  const [publicName, setPublicName] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [instagram, setInstagram] = useState<string | null>(null);
  const [facebook, setFacebook] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const refresh = () => {
    syncRedemptionExpirations();
    setData(getData());
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace("/auth");
      return;
    }
    if (currentUser.role !== "partner") {
      router.replace(routeByRole(currentUser.role));
    }
  }, [router]);

  useEffect(() => {
    const updateNow = () => setNowTimestamp(Date.now());
    updateNow();
    const timer = window.setInterval(updateNow, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const company = useMemo(() => {
    if (!data || !user?.companyId) return undefined;
    return data.companies.find((item) => item.id === user.companyId);
  }, [data, user?.companyId]);

  const companyOffers = useMemo(() => {
    if (!data || !company?.id) return [];
    return data.offers
      .filter((offer) => offer.companyId === company.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, company]);

  const redemptions = useMemo(() => {
    if (!data || companyOffers.length === 0) return [];
    const companyOfferIds = new Set(companyOffers.map((offer) => offer.id));
    return data.redemptions
      .filter((item) => companyOfferIds.has(item.offerId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, companyOffers]);

  const effectivePublicName = publicName ?? (company?.publicName ?? company?.name ?? "");
  const effectiveAddressLine = addressLine ?? (company?.addressLine ?? "");
  const effectiveBio = bio ?? (company?.bio ?? "");
  const effectiveInstagram = instagram ?? (company?.instagram ?? "");
  const effectiveFacebook = facebook ?? (company?.facebook ?? "");
  const effectiveWebsite = website ?? (company?.website ?? "");
  const effectiveWhatsapp = whatsapp ?? (company?.whatsapp ?? "");
  const effectiveLogoImage = logoImage ?? (company?.logoImage ?? "");
  const effectiveCoverImage = coverImage ?? (company?.coverImage ?? "");

  const dashboard = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = nowTimestamp - 7 * 24 * 60 * 60 * 1000;

    const offersById = new Map(companyOffers.map((offer) => [offer.id, offer]));

    const statusCount = {
      generated: redemptions.filter((item) => item.status === "generated").length,
      used: redemptions.filter((item) => item.status === "used").length,
      expired: redemptions.filter((item) => item.status === "expired").length,
    };

    const redemptionsToday = redemptions.filter((item) => new Date(item.createdAt).getTime() >= todayStart.getTime()).length;
    const redemptionsWeek = redemptions.filter((item) => new Date(item.createdAt).getTime() >= weekStart).length;

    const usageByOffer = redemptions.reduce<Record<string, { generated: number; used: number }>>((acc, item) => {
      if (!acc[item.offerId]) acc[item.offerId] = { generated: 0, used: 0 };
      acc[item.offerId].generated += 1;
      if (item.status === "used") acc[item.offerId].used += 1;
      return acc;
    }, {});

    const topOfferPerformance = Object.entries(usageByOffer)
      .map(([offerId, totals]) => {
        const offer = offersById.get(offerId);
        const conversion = totals.generated > 0 ? Math.round((totals.used / totals.generated) * 100) : 0;
        return { offer, generated: totals.generated, used: totals.used, conversion };
      })
      .filter((item) => item.offer)
      .sort((a, b) => b.used - a.used)
      .slice(0, 6);

    const recentActivity = redemptions.slice(0, 12).map((item) => {
      const offer = offersById.get(item.offerId);
      return {
        id: item.id,
        createdAt: item.createdAt,
        label: `Código ${item.status}`,
        detail: `${offer?.title ?? "Oferta removida"} • ${item.code}`,
      };
    });

    return {
      offersTotal: companyOffers.length,
      offersApproved: companyOffers.filter((offer) => offer.approved).length,
      offersPending: companyOffers.filter((offer) => !offer.approved && !offer.rejected).length,
      redemptionsToday,
      redemptionsWeek,
      statusCount,
      topOfferPerformance,
      recentActivity,
    };
  }, [companyOffers, redemptions, nowTimestamp]);

  const filteredRedemptions = redemptions.filter((item) =>
    redemptionFilter === "all" ? true : item.status === redemptionFilter,
  );

  const customerInsights = useMemo(() => {
    if (!data || redemptions.length === 0) return [];

    const usersById = new Map(data.users.map((item) => [item.id, item]));
    const offersById = new Map(companyOffers.map((item) => [item.id, item]));

    const grouped = redemptions.reduce<
      Record<
        string,
        {
          userId: string;
          generated: number;
          used: number;
          expired: number;
          lastCreatedAt: string;
          lastCode: string;
          offers: Set<string>;
        }
      >
    >((acc, item) => {
      if (!acc[item.userId]) {
        acc[item.userId] = {
          userId: item.userId,
          generated: 0,
          used: 0,
          expired: 0,
          lastCreatedAt: item.createdAt,
          lastCode: item.code,
          offers: new Set<string>(),
        };
      }

      const current = acc[item.userId];
      current.generated += 1;
      if (item.status === "used") current.used += 1;
      if (item.status === "expired") current.expired += 1;
      if (new Date(item.createdAt).getTime() > new Date(current.lastCreatedAt).getTime()) {
        current.lastCreatedAt = item.createdAt;
        current.lastCode = item.code;
      }

      const offerTitle = offersById.get(item.offerId)?.title;
      if (offerTitle) current.offers.add(offerTitle);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((entry) => {
        const user = usersById.get(entry.userId);
        return {
          userId: entry.userId,
          name: user?.name ?? "Cliente não identificado",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
          generated: entry.generated,
          used: entry.used,
          expired: entry.expired,
          lastCreatedAt: entry.lastCreatedAt,
          lastCode: entry.lastCode,
          offers: Array.from(entry.offers).slice(0, 3),
        };
      })
      .sort((a, b) => new Date(b.lastCreatedAt).getTime() - new Date(a.lastCreatedAt).getTime());
  }, [companyOffers, data, redemptions]);

  const partnerNotifications = useMemo(() => {
    if (!data || !user) return [];
    return data.notifications
      .filter((item) => item.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, user]);

  const unreadNotifications = partnerNotifications.filter((item) => !item.read).length;

  const validate = () => {
    setFeedback("");
    if (!company) {
      setFeedback("Empresa não encontrada.");
      showToast("Empresa não encontrada.", "error");
      return;
    }
    const result = validateCode(code, company.id);
    setFeedback(result.message);
    showToast(result.message, result.ok ? "success" : "error");
    setCode("");
    refresh();
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    if (!company) {
      setProfileFeedback("Empresa não encontrada.");
      showToast("Empresa não encontrada.", "error");
      return;
    }

    updateCompanyProfile(company.id, {
      publicName: effectivePublicName,
      addressLine: effectiveAddressLine,
      bio: effectiveBio,
      instagram: effectiveInstagram,
      facebook: effectiveFacebook,
      website: effectiveWebsite,
      whatsapp: effectiveWhatsapp,
      logoImage: effectiveLogoImage || undefined,
      coverImage: effectiveCoverImage || undefined,
    });

    setProfileFeedback("Perfil público atualizado com sucesso.");
    showToast("Perfil público atualizado com sucesso.", "success");
    refresh();
  };

  const onSelectProfileImage = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: "logo" | "cover",
  ) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    try {
      const encoded = await readFileAsDataUrl(selectedFile);
      if (kind === "logo") setLogoImage(encoded);
      if (kind === "cover") setCoverImage(encoded);
      setProfileFeedback("");
    } catch {
      setProfileFeedback("Não foi possível processar a imagem selecionada.");
      showToast("Não foi possível processar a imagem selecionada.", "error");
    }
  };

  const createPartnerOffer = (event: FormEvent) => {
    event.preventDefault();
    setOfferFeedback("");

    if (!company) {
      setOfferFeedback("Empresa não encontrada.");
      showToast("Empresa não encontrada.", "error");
      return;
    }

    if (images.length === 0) {
      setOfferFeedback("Adicione ao menos 1 foto da oferta.");
      showToast("Adicione ao menos 1 foto da oferta.", "error");
      return;
    }

    createOffer({
      companyId: company.id,
      title,
      description,
      discountLabel,
      category,
      neighborhood,
      images,
    });

    setTitle("");
    setDescription("");
    setDiscountLabel("");
    setCategory("");
    setImages([]);
    setImageFeedback("");
    setOfferFeedback("Oferta publicada com sucesso.");
    showToast("Oferta publicada com sucesso.", "success");
    refresh();
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
      showToast("Limite máximo de 5 fotos por oferta.", "info");
    }

    try {
      const encodedImages = await Promise.all(filesToRead.map((file) => readFileAsDataUrl(file)));
      setImages((current) => [...current, ...encodedImages].slice(0, 5));
    } catch {
      setImageFeedback("Não foi possível processar uma das imagens.");
      showToast("Não foi possível processar uma das imagens.", "error");
    }
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const setCoverImageFromOffer = (index: number) => {
    setImages((current) => {
      if (index <= 0 || index >= current.length) return current;
      const selected = current[index];
      const remaining = current.filter((_, currentIndex) => currentIndex !== index);
      return [selected, ...remaining];
    });
  };

  const sectionTitle: Record<PartnerSection, string> = {
    overview: "Visão geral",
    profile: "Perfil público",
    validate: "Validação de código",
    offer: "Cadastro de oferta",
    redemptions: "Resgates",
    customers: "Clientes",
    notifications: "Notificações",
    activity: "Atividade recente",
  };

  const selectSection = (nextSection: PartnerSection) => {
    setSection(nextSection);
    setSidebarOpen(false);
  };

  if (!user || !data) return <main className="clubezn-shell">Carregando...</main>;

  return (
    <main className="clubezn-shell grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
      <PartnerDashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        section={section}
        onSectionChange={selectSection}
        companyName={company?.publicName ?? company?.name ?? "Parceiro"}
        logoImage={effectiveLogoImage || undefined}
        onLogout={() => {
          clearSession();
          router.push("/auth");
        }}
      />

      <div className="grid gap-4">
        <section className="card grid gap-2">
          {effectiveCoverImage && (
            <Image
              src={effectiveCoverImage}
              alt="Capa da empresa"
              width={1200}
              height={280}
              unoptimized
              style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12 }}
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Empresa Parceira</p>
              <h1 style={{ margin: "2px 0 0", fontSize: 22 }}>{company?.publicName ?? company?.name ?? user.name}</h1>
            </div>
            <span className="badge badge-ok">Ativa</span>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
            Seção atual: <strong>{sectionTitle[section]}</strong>
          </p>
          {unreadNotifications > 0 && (
            <p style={{ margin: 0, color: "var(--brand-2)", fontSize: 13, fontWeight: 700 }}>
              Você tem {unreadNotifications} notificação(ões) não lida(s).
            </p>
          )}
        </section>

        {section === "overview" && (
          <>
            <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Ofertas totais" value={dashboard.offersTotal} helper="Cadastradas pela empresa" />
              <MetricCard label="Ofertas aprovadas" value={dashboard.offersApproved} helper="Publicadas ao consumidor" />
              <MetricCard label="Resgates hoje" value={dashboard.redemptionsToday} helper="Gerados no dia atual" />
              <MetricCard label="Resgates 7 dias" value={dashboard.redemptionsWeek} helper="Janela móvel semanal" />
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="card grid gap-2">
                <h2 style={{ margin: 0, fontSize: 18 }}>Painel operacional</h2>
                <StatusLine label="Códigos gerados" value={dashboard.statusCount.generated} tone="pending" />
                <StatusLine label="Códigos usados" value={dashboard.statusCount.used} tone="ok" />
                <StatusLine label="Códigos expirados" value={dashboard.statusCount.expired} tone="danger" />
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                  Ofertas pendentes de aprovação: <strong>{dashboard.offersPending}</strong>
                </p>
              </section>

              <section className="card grid gap-2">
                <h2 style={{ margin: 0, fontSize: 18 }}>Performance por oferta</h2>
                {dashboard.topOfferPerformance.map((item) => (
                  <div key={item.offer?.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{item.offer?.title}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      {item.used} uso(s) • {item.generated} código(s) • {item.conversion}% conversão
                    </p>
                  </div>
                ))}
                {dashboard.topOfferPerformance.length === 0 && <p style={{ margin: 0 }}>Sem dados de performance ainda.</p>}
              </section>
            </div>
          </>
        )}

        {section === "profile" && (
          <section className="card grid gap-2.5">
            <h2 style={{ margin: 0, fontSize: 18 }}>Perfil público da empresa</h2>
            <form onSubmit={saveProfile} className="grid gap-2">
              <label className="field">
                  <span>Nome público</span>
                <input
                  value={effectivePublicName}
                  onChange={(event) => setPublicName(event.target.value)}
                  placeholder="Nome que aparecerá para os clientes"
                  required
                />
              </label>

              <label className="field">
                <span>Endereço</span>
                <input
                  value={effectiveAddressLine}
                  onChange={(event) => setAddressLine(event.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                />
              </label>

              <label className="field">
                <span>Descrição</span>
                <textarea
                  value={effectiveBio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={3}
                  placeholder="Como a empresa quer se apresentar no público"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="field">
                  <span>Instagram</span>
                  <input
                    value={effectiveInstagram}
                    onChange={(event) => setInstagram(event.target.value)}
                    placeholder="@suaempresa"
                  />
                </label>
                <label className="field">
                  <span>Facebook</span>
                  <input
                    value={effectiveFacebook}
                    onChange={(event) => setFacebook(event.target.value)}
                    placeholder="facebook.com/suaempresa"
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="field">
                  <span>Site</span>
                  <input value={effectiveWebsite} onChange={(event) => setWebsite(event.target.value)} placeholder="https://..." />
                </label>
                <label className="field">
                  <span>WhatsApp</span>
                  <input value={effectiveWhatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="51999990000" />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="field">
                  <span>Logomarca</span>
                  <input type="file" accept="image/*" onChange={(event) => onSelectProfileImage(event, "logo")} />
                </label>
                <label className="field">
                  <span>Foto de capa</span>
                  <input type="file" accept="image/*" onChange={(event) => onSelectProfileImage(event, "cover")} />
                </label>
              </div>

              {(effectiveLogoImage || effectiveCoverImage) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="card grid gap-1.5 p-2">
                    <strong style={{ fontSize: 13 }}>Logomarca</strong>
                    {effectiveLogoImage ? (
                      <>
                        <Image
                          src={effectiveLogoImage}
                          alt="Pré-visualização da logomarca"
                          width={240}
                          height={120}
                          unoptimized
                          style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }}
                        />
                        <button type="button" className="btn btn-ghost !py-1.5 !px-2" onClick={() => setLogoImage("")}>
                          Remover logomarca
                        </button>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Sem logomarca definida.</p>
                    )}
                  </div>
                  <div className="card grid gap-1.5 p-2">
                    <strong style={{ fontSize: 13 }}>Capa</strong>
                    {effectiveCoverImage ? (
                      <>
                        <Image
                          src={effectiveCoverImage}
                          alt="Pré-visualização da capa"
                          width={320}
                          height={120}
                          unoptimized
                          style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10 }}
                        />
                        <button type="button" className="btn btn-ghost !py-1.5 !px-2" onClick={() => setCoverImage("")}>
                          Remover capa
                        </button>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Sem capa definida.</p>
                    )}
                  </div>
                </div>
              )}

              <button className="btn btn-primary" type="submit">
                Salvar perfil público
              </button>
            </form>
            {profileFeedback && <p style={{ margin: 0, fontWeight: 700 }}>{profileFeedback}</p>}
          </section>
        )}

        {section === "validate" && (
          <section className="card grid gap-2.5">
            <h2 style={{ margin: 0, fontSize: 18 }}>Validar código de benefício</h2>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Digite o código (6 dígitos)"
                style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}
              />
              <button className="btn btn-primary sm:!w-auto" onClick={validate}>
                Validar
              </button>
            </div>
            {feedback && <p style={{ margin: 0, fontWeight: 700 }}>{feedback}</p>}
          </section>
        )}

        {section === "offer" && (
          <>
            <section className="card grid gap-2.5">
              <h2 style={{ margin: 0, fontSize: 18 }}>Cadastrar nova oferta</h2>
              <form onSubmit={createPartnerOffer} className="grid gap-2">
                <label className="field">
                  <span>Título</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} required />
                </label>

                <label className="field">
                  <span>Descrição</span>
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} required />
                </label>

                <label className="field">
                  <span>Chamada do desconto</span>
                  <input
                    value={discountLabel}
                    onChange={(event) => setDiscountLabel(event.target.value)}
                    placeholder="Ex.: 20% OFF"
                    required
                  />
                </label>

                <label className="field">
                  <span>Categoria</span>
                  <input value={category} onChange={(event) => setCategory(event.target.value)} required />
                </label>

                <label className="field">
                  <span>Bairro</span>
                  <input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} required />
                </label>

                <label className="field">
                  <span>Fotos da oferta (até 5)</span>
                  <input accept="image/*" multiple onChange={onSelectImages} type="file" />
                </label>

                <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>
                  A primeira foto será usada como capa no card exibido para consumidores.
                </p>

                {imageFeedback && <p style={{ margin: 0, color: "var(--warn)", fontWeight: 700 }}>{imageFeedback}</p>}

                {images.length > 0 && (
                  <div className="grid gap-2">
                    <strong>Pré-visualização ({images.length}/5)</strong>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {images.map((imageSrc, index) => (
                        <article key={imageSrc.slice(0, 40) + index} className="card grid gap-1.5 p-2">
                          <Image
                            alt={`Foto ${index + 1} da oferta`}
                            height={90}
                            src={imageSrc}
                            unoptimized
                            width={180}
                            style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }}
                          />
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 700,
                              color: index === 0 ? "var(--brand-2)" : "var(--muted)",
                            }}
                          >
                            {index === 0 ? "Foto de capa" : `Foto ${index + 1}`}
                          </p>
                          <div className="grid gap-1">
                            {index > 0 && (
                              <button
                                className="btn btn-ghost !py-1.5 !px-2"
                                onClick={() => setCoverImageFromOffer(index)}
                                type="button"
                              >
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

                <button className="btn btn-primary" type="submit">
                  Publicar oferta
                </button>
              </form>
              {offerFeedback && <p style={{ margin: 0, fontWeight: 700 }}>{offerFeedback}</p>}
            </section>

            <section className="card grid gap-2">
              <h2 style={{ margin: 0, fontSize: 18 }}>Ofertas da empresa</h2>
              {companyOffers.map((offer) => (
                <div key={offer.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                  {offer.images[0] && (
                    <Image
                      alt={`Capa da oferta ${offer.title}`}
                      height={96}
                      src={offer.images[0]}
                      unoptimized
                      width={320}
                      style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 10, marginBottom: 8 }}
                    />
                  )}
                  <p style={{ margin: 0, fontWeight: 700 }}>{offer.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {offer.discountLabel} • {offer.images.length} foto(s) • {offer.rejected ? "Rejeitada" : "Publicada"}
                  </p>
                </div>
              ))}
              {companyOffers.length === 0 && <p style={{ margin: 0 }}>Nenhuma oferta cadastrada.</p>}
            </section>
          </>
        )}

        {section === "notifications" && (
          <section className="card grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 style={{ margin: 0, fontSize: 18 }}>Notificações de status</h2>
              <div className="flex items-center gap-2">
                <span className={`badge ${unreadNotifications > 0 ? "badge-pending" : "badge-ok"}`}>
                  {unreadNotifications} não lida(s)
                </span>
                <button
                  className="btn btn-ghost !w-auto !px-3 !py-1.5"
                  onClick={() => {
                    if (!user) return;
                    markAllNotificationsAsRead(user.id);
                    refresh();
                    showToast("Todas as notificações foram marcadas como lidas.", "success");
                  }}
                  type="button"
                >
                  Marcar todas como lidas
                </button>
              </div>
            </div>

            {partnerNotifications.map((notification) => (
              <article key={notification.id} className="grid gap-1.5 border-t pt-2" style={{ borderColor: "var(--line)" }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p style={{ margin: 0, fontWeight: 700 }}>{notification.title}</p>
                  <span className={`badge ${notification.read ? "badge-ok" : "badge-pending"}`}>
                    {notification.read ? "Lida" : "Nova"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13 }}>{notification.message}</p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>{formatDate(notification.createdAt)}</p>
                {!notification.read && (
                  <button
                    className="btn btn-ghost !w-auto !px-3 !py-1.5"
                    onClick={() => {
                      if (!user) return;
                      markNotificationAsRead(notification.id, user.id);
                      refresh();
                    }}
                    type="button"
                  >
                    Marcar como lida
                  </button>
                )}
              </article>
            ))}

            {partnerNotifications.length === 0 && <p style={{ margin: 0 }}>Sem notificações de status até o momento.</p>}
          </section>
        )}

        {section === "redemptions" && (
          <section className="card grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 style={{ margin: 0, fontSize: 18 }}>Últimos resgates</h2>
              <select
                value={redemptionFilter}
                onChange={(event) => setRedemptionFilter(event.target.value as RedemptionFilter)}
                style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", background: "#fff" }}
              >
                <option value="all">Todos</option>
                <option value="generated">Gerados</option>
                <option value="used">Usados</option>
                <option value="expired">Expirados</option>
              </select>
            </div>

            {filteredRedemptions.slice(0, 12).map((item) => {
              const offer = companyOffers.find((offerItem: Offer) => offerItem.id === item.offerId);
              return (
                <div key={item.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{offer?.title ?? "Oferta removida"}</p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                    Código {item.code} • {item.status} • criado em {formatDate(item.createdAt)}
                  </p>
                </div>
              );
            })}
            {filteredRedemptions.length === 0 && <p style={{ margin: 0 }}>Nenhum resgate encontrado nesse filtro.</p>}
          </section>
        )}

        {section === "activity" && (
          <section className="card grid gap-2">
            <h2 style={{ margin: 0, fontSize: 18 }}>Atividade recente</h2>
            {dashboard.recentActivity.map((item) => (
              <div key={item.id} className="border-t pt-2" style={{ borderColor: "var(--line)" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 13 }}>{item.detail}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{formatDate(item.createdAt)}</p>
              </div>
            ))}
            {dashboard.recentActivity.length === 0 && <p style={{ margin: 0 }}>Sem atividade recente.</p>}
          </section>
        )}

        {section === "customers" && (
          <section className="card grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 style={{ margin: 0, fontSize: 18 }}>Clientes que geraram código</h2>
              <span className="badge badge-ok">{customerInsights.length} cliente(s)</span>
            </div>

            {customerInsights.map((customer) => (
              <article key={customer.userId} className="grid gap-1.5 border-t pt-2" style={{ borderColor: "var(--line)" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{customer.name}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                  {customer.email || "Sem e-mail"} • {customer.phone || "Sem telefone"}
                </p>
                <p style={{ margin: 0, fontSize: 13 }}>
                  Códigos: {customer.generated} gerado(s) • {customer.used} usado(s) • {customer.expired} expirado(s)
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  Último código: {customer.lastCode} • {formatDate(customer.lastCreatedAt)}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  Ofertas: {customer.offers.join(" • ") || "Sem oferta vinculada"}
                </p>
              </article>
            ))}

            {customerInsights.length === 0 && (
              <p style={{ margin: 0 }}>Nenhum cliente gerou código para as ofertas da sua empresa até agora.</p>
            )}
          </section>
        )}

        <footer className="card" style={{ fontSize: 12, color: "var(--muted)" }}>
          <p style={{ margin: 0 }}>ClubeZN - Empresa Parceira</p>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <article className="card grid gap-1">
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>{value}</p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{helper}</p>
    </article>
  );
}

function StatusLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "pending" | "danger";
}) {
  const badgeClass = tone === "ok" ? "badge-ok" : tone === "danger" ? "badge-danger" : "badge-pending";
  return (
    <div className="flex items-center justify-between border-t py-2" style={{ borderColor: "var(--line)" }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <span className={`badge ${badgeClass}`}>{value}</span>
    </div>
  );
}
