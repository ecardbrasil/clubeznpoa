"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PartnerDashboardSidebar, type PartnerSection } from "@/components/partner/dashboard-sidebar";
import { PartnerOverview } from "@/components/partner/partner-overview";
import { PartnerProfileEditor } from "@/components/partner/partner-profile-editor";
import { PartnerCodeValidator } from "@/components/partner/partner-code-validator";
import { PartnerOfferCreator } from "@/components/partner/partner-offer-creator";
import { PartnerOffersPage } from "@/components/partner/partner-offers-page";
import { PartnerRedemptionsList } from "@/components/partner/partner-redemptions-list";
import { PartnerCustomersList } from "@/components/partner/partner-customers-list";
import { PartnerNotifications } from "@/components/partner/partner-notifications";
import { PartnerActivity } from "@/components/partner/partner-activity";
import { useToast } from "@/components/ui/toast";
import type { AppData, Company, Offer } from "@/lib/types";
import { isSupabaseMode } from "@/lib/runtime-config";
import { DEFAULT_CATEGORIES, parseCategories, serializeCategories } from "@/lib/categories";
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
import { PartnerDashboardSkeleton } from "@/components/partner/skeleton-loader";
import { formatDate, getOfferStatusLabel, readFileAsDataUrl } from "@/lib/partner/utils";

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

type RedemptionFilter = "all" | "generated" | "used" | "expired";

export default function PartnerPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const sidebarMounted = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("clubezn_partner_sidebar_open_v1");
    sidebarMounted.current = true;
    if (stored !== null) setSidebarOpen(stored === "1");
  }, []);
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
  const [profileCategories, setProfileCategories] = useState<string[] | null>(null);
  const [profileCategorySearch, setProfileCategorySearch] = useState("");
  const [supabaseCompany, setSupabaseCompany] = useState<Company | null>(null);

  // Offer form state
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

  const refresh = useCallback(async () => {
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

    if (!response.ok) return;

    const payload = (await response.json()) as { data?: AppData };
    if (payload.data) {
      setData(payload.data);
      if (payload.data.companies[0]) {
        setSupabaseCompany(payload.data.companies[0]);
      }
    }
  }, [user]);

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
    if (!sidebarMounted.current) return;
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
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ action: "getDashboardData", companyId }),
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
    return () => { cancelled = true; };
  }, [showToast, user?.companyId, user?.id]);

  const company = useMemo(() => {
    if (isSupabaseMode) return supabaseCompany ?? undefined;
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
    const companyCategories = parseCategories(company?.category);
    const fromCompanyOffers = companyOffers.map((offer) => offer.category).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...companyCategories, ...fromCompanyOffers]))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [company?.category, companyOffers]);

  const filteredCategorySuggestions = useMemo(() => {
    const normalizedSearch = categorySearch.trim().toLowerCase();
    return availableOfferCategories.filter((item) => {
      if (selectedCategories.includes(item)) return false;
      if (!normalizedSearch) return true;
      return item.toLowerCase().includes(normalizedSearch);
    });
  }, [availableOfferCategories, categorySearch, selectedCategories]);

  const availableNeighborhoods = useMemo(() => {
    return Array.from(
      new Set([
        ...northZoneNeighborhoods,
        company?.neighborhood ?? "",
        ...companyOffers.map((offer) => offer.neighborhood),
      ].filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
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

  useEffect(() => {
    if (selectedCategories.length === 0 && company?.category) {
      setSelectedCategories(parseCategories(company.category));
    }
  }, [company?.category, selectedCategories.length]);

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
  const effectiveProfileCategories = profileCategories ?? parseCategories(company?.category);

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

  const customerInsights = useMemo(() => {
    if (!data || redemptions.length === 0) return [];

    const usersById = new Map(data.users.map((item) => [item.id, item]));
    const offersById = new Map(companyOffers.map((item) => [item.id, item]));

    const grouped = redemptions.reduce<
      Record<string, {
        userId: string;
        generated: number;
        used: number;
        expired: number;
        lastCreatedAt: string;
        lastCode: string;
        offers: Set<string>;
      }>
    >((acc, item) => {
      if (!acc[item.userId]) {
        acc[item.userId] = {
          userId: item.userId,
          generated: 0,
          used: 0,
          expired: 0,
          lastCreatedAt: item.createdAt,
          lastCode: item.code,
          offers: new Set(),
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
        done: [effectiveWhatsapp, effectiveInstagram, effectiveFacebook, effectiveWebsite].some((v) => Boolean(v.trim())),
        section: "profile" as PartnerSection,
        actionLabel: "Configurar contatos",
      },
      {
        id: "notifications",
        title: "Revise seu centro de notificações",
        description: "Mantenha as notificações em dia para não perder atualizações.",
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

  const handleValidate = async (codeValue?: string) => {
    const codeToValidate = codeValue ?? code;
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
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ action: "validateCode", companyId: company.id, code: codeToValidate }),
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

    const result = validateCode(codeToValidate, company.id);
    setFeedback(result.message);
    showToast(result.message, result.ok ? "success" : "error");
    setCode("");
    await refresh();
  };

  const handleSaveProfile = async (payload: {
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
  }) => {
    const companyId = company?.id ?? user?.companyId;
    if (!companyId || !user?.id) {
      setProfileFeedback("Empresa não encontrada.");
      showToast("Empresa não encontrada.", "error");
      return;
    }

    if (isSupabaseMode) {
      const response = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          action: "updateProfile",
          companyId,
          payload: {
            publicName: payload.publicName,
            addressLine: payload.addressLine,
            bio: payload.bio,
            instagram: payload.instagram,
            facebook: payload.facebook,
            website: payload.website,
            whatsapp: payload.whatsapp,
            logoImage: payload.logoImage || undefined,
            coverImage: payload.coverImage || undefined,
            category: serializeCategories(payload.categories),
          },
        }),
      });

      if (!response.ok) {
        setProfileFeedback("Não foi possível salvar o perfil público.");
        showToast("Não foi possível salvar o perfil público.", "error");
        return;
      }

      const result = (await response.json()) as { company?: Company };
      if (result.company) {
        setSupabaseCompany(result.company);
      }
      setProfileFeedback("Perfil público atualizado com sucesso.");
      showToast("Perfil público atualizado com sucesso.", "success");
      return;
    }

    updateCompanyProfile(companyId, {
      publicName: payload.publicName,
      addressLine: payload.addressLine,
      bio: payload.bio,
      instagram: payload.instagram,
      facebook: payload.facebook,
      website: payload.website,
      whatsapp: payload.whatsapp,
      logoImage: payload.logoImage || undefined,
      coverImage: payload.coverImage || undefined,
    });

    setProfileFeedback("Perfil público atualizado com sucesso.");
    showToast("Perfil público atualizado com sucesso.", "success");
    await refresh();
  };

  const handleCreateOffer = async (payload: {
    title: string;
    description: string;
    discountLabel: string;
    category: string;
    neighborhood: string;
    images: string[];
  }): Promise<string | null> => {
    if (!company) {
      const msg = "Empresa não encontrada.";
      showToast(msg, "error");
      return msg;
    }

    setIsPublishingOffer(true);

    try {
      if (isSupabaseMode) {
        if (!user) return "Usuário não autenticado.";
        const response = await fetch("/api/partner", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            action: "createOffer",
            companyId: company.id,
            payload: {
              title: payload.title,
              description: payload.description,
              discountLabel: payload.discountLabel,
              category: payload.category,
              neighborhood: payload.neighborhood,
              images: payload.images,
            },
          }),
        });

        const result = (await response.json()) as { error?: string };
        if (!response.ok || result.error) {
          showToast(result.error || "Falha ao publicar oferta.", "error");
          return result.error || "Falha ao publicar oferta.";
        }
      } else {
        createOffer({
          companyId: company.id,
          title: payload.title,
          description: payload.description,
          discountLabel: payload.discountLabel,
          category: payload.category,
          neighborhood: payload.neighborhood,
          images: payload.images,
        });
      }

      showToast("Oferta criada com sucesso.", "success");
      await refresh();
      setSection("overview");
      return null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Falha ao publicar oferta.";
      showToast(msg, "error");
      return msg;
    } finally {
      setIsPublishingOffer(false);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    if (isSupabaseMode) {
      await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          action: "markNotificationAsRead",
          companyId: company?.id ?? user.companyId,
          notificationId,
        }),
      });
    } else {
      markNotificationAsRead(notificationId, user.id);
    }
    await refresh();
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    if (isSupabaseMode) {
      await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ action: "markAllNotificationsAsRead", companyId: company?.id ?? user.companyId }),
      });
    } else {
      markAllNotificationsAsRead(user.id);
    }
    await refresh();
    showToast("Todas as notificações foram marcadas como lidas.", "success");
  };

  const selectSection = (nextSection: PartnerSection) => {
    setSection(nextSection);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
    }
  };

  if (!user || loadingData || !data) {
    return (
      <main className="clubezn-shell">
        <PartnerDashboardSkeleton />
      </main>
    );
  }

  const sectionComponents: Record<PartnerSection, React.ReactNode> = {
    overview: (
      <PartnerOverview
        section={section}
        onSectionChange={selectSection}
        companyOffers={companyOffers}
        dashboard={dashboard}
        onboardingSteps={onboardingSteps}
        onboardingCompleted={onboardingCompleted}
      />
    ),
    profile: (
      <PartnerProfileEditor
        effectivePublicName={effectivePublicName}
        effectiveAddressLine={effectiveAddressLine}
        effectiveHasPhysicalAddress={effectiveHasPhysicalAddress}
        effectiveBio={effectiveBio}
        effectiveInstagram={effectiveInstagram}
        effectiveFacebook={effectiveFacebook}
        effectiveWebsite={effectiveWebsite}
        effectiveWhatsapp={effectiveWhatsapp}
        effectiveLogoImage={effectiveLogoImage}
        effectiveCoverImage={effectiveCoverImage}
        effectiveProfileCategories={effectiveProfileCategories}
        onSave={handleSaveProfile}
        feedback={profileFeedback}
      />
    ),
    validate: (
      <PartnerCodeValidator
        companyId={company?.id ?? user?.companyId ?? ""}
        validate={async (codeValue) => {
          await handleValidate(codeValue);
        }}
      />
    ),
    offer: (
      <PartnerOffersPage
        companyId={company?.id ?? ""}
        companyOffers={companyOffers}
        availableNeighborhoods={availableNeighborhoods}
        availableOfferCategories={availableOfferCategories}
        defaultCategories={DEFAULT_CATEGORIES}
        isPublishing={isPublishingOffer}
        onSubmit={handleCreateOffer}
      />
    ),
    redemptions: (
      <PartnerRedemptionsList
        companyOffers={companyOffers}
        redemptions={redemptions}
      />
    ),
    customers: (
      <PartnerCustomersList customers={customerInsights} />
    ),
    notifications: (
      <PartnerNotifications
        notifications={partnerNotifications}
        userId={user?.id ?? ""}
        companyId={company?.id ?? user?.companyId ?? ""}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    ),
    activity: (
      <PartnerActivity activities={dashboard.recentActivity} />
    ),
  };

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
        {sectionComponents[section]}
        <footer className="card" style={{ fontSize: 12, color: "var(--muted)" }}>
          <p style={{ margin: 0 }}>ClubeZN - Empresa Parceira</p>
        </footer>
      </div>
    </main>
  );
}