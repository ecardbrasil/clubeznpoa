"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PartnerDashboardSidebar, PartnerSection } from "@/components/partner/dashboard-sidebar";
import { useToast } from "@/components/ui/toast";
import { AppData, Company, Offer } from "@/lib/types";
import { isSupabaseMode } from "@/lib/runtime-config";
import {
  clearSession,
  createOffer,
  getAuthHeaders,
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

const defaultOfferCategories = [
  "Supermercado",
  "Farmácia",
  "Restaurante",
  "Padaria",
  "Cafeteria",
  "Pet",
  "Beleza",
  "Saúde",
  "Educação",
  "Serviços",
  "Moda",
  "Casa e decoração",
];

const northZoneNeighborhoods = [
  "Sarandi",
  "Santa Rosa de Lima",
  "Passo das Pedras",
  "Rubem Berta",
  "Jardim Leopoldina",
  "Parque Santa Fe",
  "Jardim Itu",
  "Costa e Silva",
  "Jardim Lindóia",
  "Cristo Redentor",
  "Vila Ipiranga",
  "Passo da Areia",
];

export default function PartnerPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("clubezn_partner_sidebar_open_v1");
    if (stored === null) return true;
    return stored === "1";
  });
  const [section, setSection] = useState<PartnerSection>("overview");
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");
  const [offerFeedback, setOfferFeedback] = useState("");
  const [profileFeedback, setProfileFeedback] = useState("");
  const [redemptionFilter, setRedemptionFilter] = useState<RedemptionFilter>("all");
  const [nowTimestamp, setNowTimestamp] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  const user = getCurrentUser();
  const [data, setData] = useState<AppData | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [neighborhood, setNeighborhood] = useState("Sarandi");
  const [images, setImages] = useState<string[]>([]);
  const [imageFeedback, setImageFeedback] = useState("");
  const [isPublishingOffer, setIsPublishingOffer] = useState(false);
  const [neighborhoodAutofilled, setNeighborhoodAutofilled] = useState(false);
  const [onboardingExpanded, setOnboardingExpanded] = useState(false);

  const [publicName, setPublicName] = useState<string | null>(null);
  const [hasPhysicalAddress, setHasPhysicalAddress] = useState<boolean | null>(null);
  const [addressLine, setAddressLine] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [instagram, setInstagram] = useState<string | null>(null);
  const [facebook, setFacebook] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [supabaseCompany, setSupabaseCompany] = useState<Company | null>(null);

  const refresh = async () => {
    if (!user) return;
    if (!isSupabaseMode) {
      syncRedemptionExpirations();
      setData(getData());
      return;
    }
    if (!user.companyId) return;

    const response = await fetch("/api/partner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        action: "getDashboardData",
        companyId: user.companyId,
      }),
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { data?: AppData };
    if (payload.data) {
      setData(payload.data);
      if (payload.data.companies[0]) {
        setSupabaseCompany(payload.data.companies[0]);
      }
    }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("clubezn_partner_sidebar_open_v1", sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  useEffect(() => {
    let cancelled = false;
    const userId = user?.id;
    const companyId = user?.companyId;

    const load = async () => {
      if (!userId) return;
      setLoadingData(true);
      if (!isSupabaseMode) {
        syncRedemptionExpirations();
        if (!cancelled) {
          setData(getData());
          setLoadingData(false);
        }
        return;
      }

      if (!companyId) {
        if (!cancelled) setLoadingData(false);
        return;
      }

      try {
        const response = await fetch("/api/partner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            action: "getDashboardData",
            companyId,
          }),
        });

        const payload = (await response.json()) as { data?: AppData; error?: string };
        if (!response.ok || payload.error || !payload.data) {
          throw new Error(payload.error || "Falha ao carregar painel do parceiro.");
        }

        if (!cancelled) {
          setData(payload.data);
          setSupabaseCompany(payload.data.companies[0] ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setData(null);
          showToast(error instanceof Error ? error.message : "Falha ao carregar painel do parceiro.", "error");
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [showToast, user?.companyId, user?.id]);

  const company = useMemo(() => {
    if (isSupabaseMode) {
      return supabaseCompany ?? undefined;
    }
    if (!data || !user?.companyId) return undefined;
    return data.companies.find((item) => item.id === user.companyId);
  }, [data, supabaseCompany, user?.companyId]);

  const companyOffers = useMemo(() => {
    if (!data || !company?.id) return [];
    return data.offers
      .filter((offer) => offer.companyId === company.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, company]);

  const availableOfferCategories = useMemo(() => {
    const fromCompanyOffers = companyOffers.map((offer) => offer.category).filter(Boolean);
    const all = Array.from(new Set([...defaultOfferCategories, ...fromCompanyOffers])).sort((a, b) => a.localeCompare(b, "pt-BR"));
    return all;
  }, [companyOffers]);

  const filteredCategorySuggestions = useMemo(() => {
    const normalizedSearch = categorySearch.trim().toLowerCase();
    return availableOfferCategories.filter((item) => {
      if (selectedCategories.includes(item)) return false;
      if (!normalizedSearch) return true;
      return item.toLowerCase().includes(normalizedSearch);
    });
  }, [availableOfferCategories, categorySearch, selectedCategories]);

  const availableNeighborhoods = useMemo(() => {
    const merged = Array.from(
      new Set([
        ...northZoneNeighborhoods,
        company?.neighborhood ?? "",
        ...companyOffers.map((offer) => offer.neighborhood),
      ].filter(Boolean)),
    );
    return merged.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [company?.neighborhood, companyOffers]);

  const redemptions = useMemo(() => {
    if (!data || companyOffers.length === 0) return [];
    const companyOfferIds = new Set(companyOffers.map((offer) => offer.id));
    return data.redemptions
      .filter((item) => companyOfferIds.has(item.offerId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, companyOffers]);

  useEffect(() => {
    if (!company?.neighborhood || neighborhoodAutofilled) return;
    setNeighborhood(company.neighborhood);
    setNeighborhoodAutofilled(true);
  }, [company?.neighborhood, neighborhoodAutofilled]);

  const effectivePublicName = publicName ?? (company?.publicName ?? company?.name ?? "");
  const effectiveAddressLine = addressLine ?? (company?.addressLine ?? "");
  const effectiveHasPhysicalAddress = hasPhysicalAddress ?? Boolean((company?.addressLine ?? "").trim());
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
  const onboardingSteps = useMemo(
    () => [
      {
        id: "first-offer",
        title: "Cadastre sua primeira oferta",
        description: "Publique uma oferta para começar a aparecer para os moradores.",
        done: companyOffers.length > 0,
        section: "offer" as PartnerSection,
        actionLabel: "Ir para cadastro de oferta",
      },
      {
        id: "public-profile",
        title: "Complete seu perfil público",
        description: "Preencha nome público, endereço físico e uma descrição da empresa.",
        done: Boolean(effectivePublicName.trim()) && (Boolean(effectiveAddressLine.trim()) || Boolean(effectiveBio.trim())),
        section: "profile" as PartnerSection,
        actionLabel: "Completar perfil",
      },
      {
        id: "branding",
        title: "Adicione logomarca e foto de capa",
        description: "Isso melhora a confiança e o destaque da sua empresa nas páginas públicas.",
        done: Boolean(effectiveLogoImage) && Boolean(effectiveCoverImage),
        section: "profile" as PartnerSection,
        actionLabel: "Adicionar imagens",
      },
      {
        id: "contact",
        title: "Ative ao menos um canal de contato",
        description: "Informe WhatsApp, Instagram, Facebook ou site para facilitar o contato.",
        done: [effectiveWhatsapp, effectiveInstagram, effectiveFacebook, effectiveWebsite].some((value) => Boolean(value.trim())),
        section: "profile" as PartnerSection,
        actionLabel: "Configurar contatos",
      },
      {
        id: "notifications",
        title: "Revise seu centro de notificações",
        description: "Acompanhe aprovações e deixe as notificações em dia.",
        done: partnerNotifications.length > 0 && unreadNotifications === 0,
        section: "notifications" as PartnerSection,
        actionLabel: "Abrir notificações",
      },
    ],
    [
      companyOffers.length,
      effectiveAddressLine,
      effectiveBio,
      effectiveCoverImage,
      effectiveFacebook,
      effectiveInstagram,
      effectiveLogoImage,
      effectivePublicName,
      effectiveWebsite,
      effectiveWhatsapp,
      partnerNotifications.length,
      unreadNotifications,
    ],
  );
  const onboardingCompleted = onboardingSteps.filter((step) => step.done).length;

  const validate = async () => {
    setFeedback("");
    if (!company) {
      setFeedback("Empresa não encontrada.");
      showToast("Empresa não encontrada.", "error");
      return;
    }

    if (isSupabaseMode) {
      if (!user) return;
      const response = await fetch("/api/partner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          action: "validateCode",
          companyId: company.id,
          code,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      const message = payload.message ?? "Falha ao validar código.";
      const ok = response.ok;
      setFeedback(message);
      showToast(message, ok ? "success" : "error");
      setCode("");
      await refresh();
      return;
    }

    const result = validateCode(code, company.id);
    setFeedback(result.message);
    showToast(result.message, result.ok ? "success" : "error");
    setCode("");
    await refresh();
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    const companyId = company?.id ?? user?.companyId;

    if (!companyId || !user?.id) {
      setProfileFeedback("Empresa não encontrada.");
      showToast("Empresa não encontrada.", "error");
      return;
    }

    const normalizedAddressLine = effectiveHasPhysicalAddress ? effectiveAddressLine : "";

    if (isSupabaseMode) {
      const response = await fetch("/api/partner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          action: "updateProfile",
          companyId,
          payload: {
            publicName: effectivePublicName,
            addressLine: normalizedAddressLine,
            bio: effectiveBio,
            instagram: effectiveInstagram,
            facebook: effectiveFacebook,
            website: effectiveWebsite,
            whatsapp: effectiveWhatsapp,
            logoImage: effectiveLogoImage || undefined,
            coverImage: effectiveCoverImage || undefined,
          },
        }),
      });

      if (!response.ok) {
        setProfileFeedback("Não foi possível salvar o perfil público.");
        showToast("Não foi possível salvar o perfil público.", "error");
        return;
      }

      const payload = (await response.json()) as { company?: Company };
      if (payload.company) {
        setSupabaseCompany(payload.company);
      }
      setProfileFeedback("Perfil público atualizado com sucesso.");
      showToast("Perfil público atualizado com sucesso.", "success");
      return;
    }

    updateCompanyProfile(companyId, {
      publicName: effectivePublicName,
      addressLine: normalizedAddressLine,
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
    await refresh();
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
    setSelectedCategories((current) => (current.includes(item) ? current.filter((categoryItem) => categoryItem !== item) : [...current, item]));
  };

  const createPartnerOffer = async (event: FormEvent) => {
    event.preventDefault();
    setOfferFeedback("");
    setImageFeedback("");

    if (!company) {
      setOfferFeedback("Empresa não encontrada.");
      showToast("Empresa não encontrada.", "error");
      return;
    }

    const missingRequiredItems: string[] = [];
    if (!title.trim()) missingRequiredItems.push("Título");
    if (!description.trim()) missingRequiredItems.push("Descrição");
    if (!discountLabel.trim()) missingRequiredItems.push("Chamada do desconto");
    if (selectedCategories.length === 0) missingRequiredItems.push("Categoria");
    if (!neighborhood.trim()) missingRequiredItems.push("Bairro");
    if (images.length === 0) missingRequiredItems.push("Fotos da oferta");

    if (missingRequiredItems.length > 0) {
      const message = `Não foi possível cadastrar a oferta. Complete: ${missingRequiredItems.join(", ")}.`;
      setOfferFeedback(message);
      showToast(message, "error");
      return;
    }

    const mainCategory = selectedCategories[0];
    setIsPublishingOffer(true);

    try {
      if (isSupabaseMode) {
        if (!user) return;
        const response = await fetch("/api/partner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            action: "createOffer",
            companyId: company.id,
            payload: {
              title: title.trim(),
              description: description.trim(),
              discountLabel: discountLabel.trim(),
              category: mainCategory,
              neighborhood: neighborhood.trim(),
              images,
            },
          }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok || payload.error) {
          setOfferFeedback(payload.error || "Falha ao publicar oferta.");
          showToast(payload.error || "Falha ao publicar oferta.", "error");
          return;
        }
      } else {
        createOffer({
          companyId: company.id,
          title: title.trim(),
          description: description.trim(),
          discountLabel: discountLabel.trim(),
          category: mainCategory,
          neighborhood: neighborhood.trim(),
          images,
        });
      }

      setTitle("");
      setDescription("");
      setDiscountLabel("");
      setSelectedCategories([]);
      setCategorySearch("");
      setImages([]);
      setImageFeedback("");
      setOfferFeedback("Oferta publicada com sucesso.");
      showToast("Oferta publicada com sucesso.", "success");
      await refresh();
      setSection("overview");
    } finally {
      setIsPublishingOffer(false);
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
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
    }
  };

  if (!user || loadingData || !data) return <main className="clubezn-shell">Carregando...</main>;

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
            <section className="card grid gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>Checklist inicial do parceiro</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {onboardingExpanded
                      ? "Conclua estes passos para deixar o perfil pronto e começar a gerar resultados."
                      : "Checklist minimizado para economizar espaço. Abra para ver as etapas."}
                  </p>
                </div>
                <span className={`badge ${onboardingCompleted === onboardingSteps.length ? "badge-ok" : "badge-pending"}`}>
                  {onboardingCompleted}/{onboardingSteps.length} concluídos
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#dce8de] bg-[#f8fcf8] px-3 py-2">
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                  {onboardingCompleted === onboardingSteps.length
                    ? "Todas as etapas concluídas."
                    : `${onboardingSteps.length - onboardingCompleted} etapa(s) pendente(s).`}
                </p>
                <button
                  className="btn btn-ghost !w-auto !px-3 !py-1.5"
                  onClick={() => setOnboardingExpanded((current) => !current)}
                  type="button"
                >
                  {onboardingExpanded ? "Minimizar checklist" : "Abrir checklist"}
                </button>
              </div>

              {onboardingExpanded
                ? onboardingSteps.map((step, index) => (
                    <article key={step.id} className="grid gap-2 border-t pt-2" style={{ borderColor: "var(--line)" }}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p style={{ margin: 0, fontWeight: 700 }}>
                          {step.done ? "☑" : "☐"} {index + 1}. {step.title}
                        </p>
                        <span className={`badge ${step.done ? "badge-ok" : "badge-pending"}`}>
                          {step.done ? "Concluído" : "Pendente"}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{step.description}</p>
                      <button className="btn btn-ghost !w-auto !px-3 !py-1.5" onClick={() => selectSection(step.section)} type="button">
                        {step.done ? "Revisar etapa" : step.actionLabel}
                      </button>
                    </article>
                  ))
                : null}
            </section>

            <section className="card grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>Ações rápidas</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    A validação de código está disponível aqui para uso frequente.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn btn-ghost !w-auto" onClick={() => selectSection("offer")} type="button">
                    Cadastrar oferta
                  </button>
                  <button className="btn btn-primary !w-auto" onClick={() => selectSection("validate")} type="button">
                    Validar código agora
                  </button>
                </div>
              </div>
            </section>

            <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="Ofertas totais" value={dashboard.offersTotal} helper="Cadastradas pela empresa" />
              <MetricCard label="Resgates hoje" value={dashboard.redemptionsToday} helper="Gerados no dia atual" />
              <MetricCard label="Resgates 7 dias" value={dashboard.redemptionsWeek} helper="Janela móvel semanal" />
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="card grid gap-2">
                <h2 style={{ margin: 0, fontSize: 18 }}>Painel operacional</h2>
                <StatusLine label="Códigos gerados" value={dashboard.statusCount.generated} tone="pending" />
                <StatusLine label="Códigos usados" value={dashboard.statusCount.used} tone="ok" />
                <StatusLine label="Códigos expirados" value={dashboard.statusCount.expired} tone="danger" />
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
                  disabled={!effectiveHasPhysicalAddress}
                />
              </label>
              <label className="field">
                <span>Endereço físico</span>
                <select
                  value={effectiveHasPhysicalAddress ? "yes" : "no"}
                  onChange={(event) => {
                    const hasAddress = event.target.value === "yes";
                    setHasPhysicalAddress(hasAddress);
                    if (!hasAddress) {
                      setAddressLine("");
                    }
                  }}
                >
                  <option value="yes">Tenho endereço físico</option>
                  <option value="no">Não tenho endereço físico</option>
                </select>
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

                <div className="grid gap-2">
                  <label className="field">
                    <span>Categoria (multi seleção com busca)</span>
                    <input
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
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
                    {selectedCategories.length === 0 ? (
                      <span className="text-xs text-[var(--muted)]">Nenhuma categoria selecionada.</span>
                    ) : null}
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
                    {filteredCategorySuggestions.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Nenhuma categoria encontrada para esta busca.</p>
                    ) : null}
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
                      A primeira categoria selecionada será usada como categoria principal da oferta.
                    </p>
                  </div>
                </div>

                <label className="field">
                  <span>Bairro</span>
                  <select value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} required>
                    {availableNeighborhoods.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
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

                <button className="btn btn-primary" type="submit" disabled={isPublishingOffer}>
                  {isPublishingOffer ? "Publicando oferta..." : "Publicar oferta"}
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
                  onClick={async () => {
                    if (!user) return;
                    if (isSupabaseMode) {
                      await fetch("/api/partner", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...getAuthHeaders(),
                        },
                        body: JSON.stringify({
                          action: "markAllNotificationsAsRead",
                          companyId: company?.id ?? user.companyId,
                        }),
                      });
                    } else {
                      markAllNotificationsAsRead(user.id);
                    }
                    await refresh();
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
                    onClick={async () => {
                      if (!user) return;
                      if (isSupabaseMode) {
                        await fetch("/api/partner", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            ...getAuthHeaders(),
                          },
                          body: JSON.stringify({
                            action: "markNotificationAsRead",
                            companyId: company?.id ?? user.companyId,
                            notificationId: notification.id,
                          }),
                        });
                      } else {
                        markNotificationAsRead(notification.id, user.id);
                      }
                      await refresh();
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
