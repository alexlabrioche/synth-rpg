import { jsx, jsxs } from "react/jsx-runtime";
import { createRouter, createRootRouteWithContext, createFileRoute, lazyRouteComponent, HeadContent, Scripts } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useEffect, createContext, useContext } from "react";
import { QueryClient, queryOptions, useQuery } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
const appCss = "/assets/styles-iGure1y6.css";
const app$1 = { "title": "Synth RPG", "buttons": { "hello": "Say hello" }, "actions": { "createCharacter": "Create character" }, "selection": { "title": "Selected capabilities", "empty": "Pick at least one capability to continue", "total": "Total" }, "loader": { "creatingCharacter": { "title": "Summoning your character", "subtitle": "This usually takes a few seconds." } } };
const character$1 = { "title": "Character sheet", "actions": { "back": "Back to selection", "readyTitle": "Ready to begin?", "readySubtitle": "Your synth is tuned. Start the adventure when you are.", "startAdventure": "Start adventure", "startingAdventure": "Summoning the opening scene…" }, "sections": { "story": "Story", "traits": "Traits", "stats": "Stats", "capabilities": "Capabilities", "capabilityCountLabel": "total" }, "stats": { "density": "density", "chaos": "chaos", "stability": "stability", "percussiveness": "percussion", "expressivity": "expressivity", "spatiality": "space" } };
const states$1 = { "loadingCharacter": "Loading character…", "characterError": "Unable to load character.", "loadingSession": "Loading session…", "sessionError": "Unable to load this session." };
const session$1 = { "title": "Session", "meta": { "turn": "Turn" }, "sections": { "prelude": "Prelude", "events": "Events", "eventCount": "entries" }, "empty": { "events": "No events yet. Roll to awaken the world." }, "events": { "opportunity": "Opportunity", "boon": "Boon", "complication": "Complication", "mutation": "Mutation", "catastrophe": "Catastrophe" }, "actions": { "backToCharacter": "Back to character", "nextTurnTitle": "Advance the story", "nextTurnSubtitle": "Roll to discover what the world throws at you next.", "rollNext": "Roll next turn", "rolling": "Rolling next turn…" } };
const en = {
  app: app$1,
  character: character$1,
  states: states$1,
  session: session$1
};
const app = { "title": "Synth RPG", "buttons": { "hello": "Dire bonjour" }, "actions": { "createCharacter": "Créer un personnage" }, "selection": { "title": "Capacités sélectionnées", "empty": "Choisis au moins une capacité pour continuer", "total": "Total" }, "loader": { "creatingCharacter": { "title": "Invocation du personnage", "subtitle": "Cela peut prendre quelques secondes." } } };
const character = { "title": "Fiche personnage", "actions": { "back": "Retour à la sélection", "readyTitle": "Prêt à plonger ?", "readySubtitle": "Ton synthé est accordé. Lance l'aventure quand tu veux.", "startAdventure": "Commencer l'aventure", "startingAdventure": "Invocation de la scène d'ouverture…" }, "sections": { "story": "Récit", "traits": "Traits", "stats": "Statistiques", "capabilities": "Capacités", "capabilityCountLabel": "au total" }, "stats": { "density": "densité", "chaos": "chaos", "stability": "stabilité", "percussiveness": "percussivité", "expressivity": "expressivité", "spatiality": "spatialité" } };
const states = { "loadingCharacter": "Chargement du personnage…", "characterError": "Impossible de charger le personnage.", "loadingSession": "Chargement de la session…", "sessionError": "Impossible de charger cette session." };
const session = { "title": "Session", "meta": { "turn": "Tour" }, "sections": { "prelude": "Prélude", "events": "Événements", "eventCount": "entrées" }, "empty": { "events": "Aucun événement pour l'instant. Lance le dé pour éveiller le monde." }, "events": { "opportunity": "Opportunité", "boon": "Bénédiction", "complication": "Complication", "mutation": "Mutation", "catastrophe": "Catastrophe" }, "actions": { "backToCharacter": "Retour au personnage", "nextTurnTitle": "Fais avancer le récit", "nextTurnSubtitle": "Lance pour découvrir ce que le monde t'envoie ensuite.", "rollNext": "Lancer le prochain tour", "rolling": "Lancement en cours…" } };
const fr = {
  app,
  character,
  states,
  session
};
const DEFAULT_LANG = "en";
const baseDictionaries = {
  en,
  fr
};
const I18nContext = createContext(void 0);
function I18nProvider({
  children,
  initialLang = DEFAULT_LANG
}) {
  const [lang, setLang] = useState(initialLang);
  const [dictionaries, setDictionaries] = useState(() => ({
    en: structuredCloneTranslationTree(baseDictionaries.en),
    fr: structuredCloneTranslationTree(baseDictionaries.fr)
  }));
  const extend = useCallback((entries) => {
    if (!entries) {
      return;
    }
    setDictionaries((prev) => {
      let didMutate = false;
      const next = { ...prev };
      Object.entries(entries).forEach(([entryLang, additions]) => {
        if (!additions) {
          return;
        }
        const current = next[entryLang] ?? {};
        const merged = deepMerge(current, additions);
        if (merged !== current) {
          didMutate = true;
          next[entryLang] = merged;
        }
      });
      return didMutate ? next : prev;
    });
  }, []);
  const translate = useCallback(
    (key, fallback) => {
      const dictionary = dictionaries[lang];
      const value2 = getByPath(dictionary, key);
      if (typeof value2 === "string") {
        return value2;
      }
      if (typeof value2 === "number" || typeof value2 === "boolean") {
        return String(value2);
      }
      return fallback ?? key;
    },
    [dictionaries, lang]
  );
  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: translate,
      extend
    }),
    [extend, lang, translate]
  );
  useEffect(() => {
    const persisted = readPersistedLang();
    if (persisted && persisted !== lang) {
      setLang(persisted);
    }
    if (typeof window === "undefined") {
      return;
    }
    const handleStorage = (event) => {
      if (event.key !== "lang") return;
      const next = event.newValue ? parseLang(event.newValue) : null;
      if (next && next !== lang) {
        setLang(next);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [lang]);
  return /* @__PURE__ */ jsx(I18nContext.Provider, { value, children });
}
function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
function structuredCloneTranslationTree(tree) {
  return JSON.parse(JSON.stringify(tree));
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function deepMerge(base, patch) {
  const result = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    const current = result[key];
    if (isRecord(value) && isRecord(current)) {
      result[key] = deepMerge(
        current,
        value
      );
    } else {
      result[key] = value;
    }
  });
  return result;
}
function getByPath(tree, path) {
  if (!path) {
    return void 0;
  }
  return path.split(".").reduce((acc, segment) => {
    if (!isRecord(acc)) {
      return void 0;
    }
    return acc[segment];
  }, tree);
}
function readPersistedLang() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem("lang");
    if (!raw) {
      return null;
    }
    const parsed = parseLang(raw);
    return parsed;
  } catch {
    return null;
  }
}
function parseLang(value) {
  try {
    const parsed = JSON.parse(value);
    if (parsed === "en" || parsed === "fr") {
      return parsed;
    }
    if (value === "en" || value === "fr") {
      return value;
    }
    return null;
  } catch {
    return value === "en" || value === "fr" ? value : null;
  }
}
const Route$3 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "TanStack Start Starter"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs(
      "body",
      {
        suppressHydrationWarning: true,
        className: "min-h-screen bg-background text-foreground",
        children: [
          /* @__PURE__ */ jsx(I18nProvider, { children }),
          /* @__PURE__ */ jsx(Scripts, {})
        ]
      }
    )
  ] });
}
const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";
const sanitizeBaseUrl = (value) => {
  {
    return DEFAULT_API_BASE_URL;
  }
};
const API_BASE_URL = sanitizeBaseUrl();
class ApiError extends Error {
  status;
  payload;
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}
async function request(path, config = {}) {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const { body, headers, ...rest } = config;
  const hasBody = body !== void 0 && body !== null;
  const response = await fetch(url, {
    method: config.method ?? (hasBody ? "POST" : "GET"),
    headers: {
      ...hasBody ? { "Content-Type": "application/json" } : {},
      ...headers
    },
    body: hasBody ? JSON.stringify(body) : void 0,
    ...rest
  });
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    const errorMessage = (payload && typeof payload === "object" && "error" in payload ? String(payload.error) : response.statusText) || "Request failed";
    throw new ApiError(errorMessage, response.status, payload ?? void 0);
  }
  if (!isJson) {
    return void 0;
  }
  return payload;
}
const apiClient = {
  get: (path, config) => request(path, { ...config, method: "GET" }),
  post: (path, body, config) => request(path, { ...config, method: "POST", body })
};
const CAPABILITIES_QUERY_KEY = ["capabilities"];
const capabilitiesQueryOptions = () => queryOptions({
  queryKey: CAPABILITIES_QUERY_KEY,
  queryFn: () => apiClient.get("/capabilities"),
  staleTime: 1e3 * 60 * 5
});
const useCapabilitiesQuery = (options) => useQuery({
  ...capabilitiesQueryOptions(),
  ...options
});
const $$splitComponentImporter$2 = () => import("./index-Dof9CPkV.mjs");
const Route$2 = createFileRoute("/")({
  loader: async ({
    context
  }) => {
    await context.queryClient.ensureQueryData(capabilitiesQueryOptions());
  },
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const sessionQueryKey = (sessionId) => ["session", sessionId ?? ""];
const sessionQueryOptions = (sessionId) => queryOptions({
  queryKey: sessionQueryKey(sessionId),
  queryFn: () => apiClient.get(`/sessions/${sessionId}`)
});
const useSessionQuery = (sessionId, options) => useQuery({
  ...sessionId ? sessionQueryOptions(sessionId) : {
    queryKey: sessionQueryKey(sessionId),
    queryFn: async () => {
      throw new Error("sessionId is required");
    }
  },
  enabled: Boolean(sessionId),
  ...options
});
const sessionEventsQueryKey = (sessionId) => ["session-events", sessionId ?? ""];
const sessionEventsQueryOptions = (sessionId) => queryOptions({
  queryKey: sessionEventsQueryKey(sessionId),
  queryFn: () => apiClient.get(`/sessions/${sessionId}/events`)
});
const useSessionEventsQuery = (sessionId, options) => useQuery({
  ...sessionId ? sessionEventsQueryOptions(sessionId) : {
    queryKey: sessionEventsQueryKey(sessionId),
    queryFn: async () => {
      throw new Error("sessionId is required");
    }
  },
  enabled: Boolean(sessionId),
  ...options
});
const $$splitComponentImporter$1 = () => import("./_sessionId-FKMo00mh.mjs");
const Route$1 = createFileRoute("/sessions/$sessionId")({
  loader: async ({
    context,
    params
  }) => {
    await context.queryClient.ensureQueryData(sessionQueryOptions(params.sessionId));
    await context.queryClient.ensureQueryData(sessionEventsQueryOptions(params.sessionId));
  },
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const characterQueryKey = (characterId) => ["character", characterId ?? ""];
const characterQueryOptions = (characterId) => queryOptions({
  queryKey: characterQueryKey(characterId),
  queryFn: () => apiClient.get(`/characters/${characterId}`)
});
const useCharacterQuery = (characterId, options) => useQuery({
  ...characterId ? characterQueryOptions(characterId) : {
    queryKey: characterQueryKey(characterId),
    queryFn: async () => {
      throw new Error("characterId is required");
    }
  },
  enabled: Boolean(characterId),
  ...options
});
const $$splitComponentImporter = () => import("./_characterId-B4UAjUyZ.mjs");
const Route = createFileRoute("/characters/$characterId")({
  loader: async ({
    context,
    params
  }) => {
    await context.queryClient.ensureQueryData(characterQueryOptions(params.characterId));
    await context.queryClient.ensureQueryData(capabilitiesQueryOptions());
  },
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const IndexRoute = Route$2.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$3
});
const SessionsSessionIdRoute = Route$1.update({
  id: "/sessions/$sessionId",
  path: "/sessions/$sessionId",
  getParentRoute: () => Route$3
});
const CharactersCharacterIdRoute = Route.update({
  id: "/characters/$characterId",
  path: "/characters/$characterId",
  getParentRoute: () => Route$3
});
const rootRouteChildren = {
  IndexRoute,
  CharactersCharacterIdRoute,
  SessionsSessionIdRoute
};
const routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent",
    defaultErrorComponent: ({ error }) => /* @__PURE__ */ jsx("div", { children: `Error: ${error.message}` }),
    defaultNotFoundComponent: () => /* @__PURE__ */ jsx("div", { children: "404: Page Not Found" })
  });
  setupRouterSsrQueryIntegration({
    router: router2,
    queryClient
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$2 as R,
  apiClient as a,
  useCapabilitiesQuery as b,
  characterQueryKey as c,
  sessionEventsQueryKey as d,
  Route$1 as e,
  useSessionQuery as f,
  useSessionEventsQuery as g,
  Route as h,
  useCharacterQuery as i,
  router as r,
  sessionQueryKey as s,
  useI18n as u
};
