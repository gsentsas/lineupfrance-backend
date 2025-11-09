# Guide des traductions (FR / EN)

LineUp expose l’ensemble des consoles web (landing, portail React, Ops, Admin) et l’app Expo en **français par défaut** avec un toggle anglais.  
Toutes les chaînes sont stockées dans des dictionnaires JavaScript afin d’éviter les textes en dur.

## 1. Consoles Ops (`/ops`)

- Fichier : `resources/js/ops/App.jsx`
- Dictionnaire : `const translations = { fr: { ... }, en: { ... } }`
- Utilisation : `const t = useCallback((key) => translations[locale]?.[key] ?? translations.fr[key] ?? key, [locale]);`
- Placeholders : utilisez `formatTemplate(t('topbar.greeting'), { name: user.name })`.
- Toute nouvelle chaîne UI **doit** être ajoutée dans les deux blocs (`fr` & `en`) avant d’être utilisée dans les composants.
- Le toggle FR/EN se trouve dans le header, FR reste la valeur initiale.

### Checklist Ops
1. Ajoutez la clé dans `translations.fr` et `translations.en`.
2. Récupérez `t('ma.cle')` dans le composant au lieu d’une string.
3. Si la chaîne contient des variables, passez-les via `formatTemplate`.
4. Vérifiez la pagination/tableaux : `TablePagination` accepte `t` pour traduire les libellés.

## 2. Console Admin (`/admin`)

- Fichier : `resources/js/admin/AdminApp.jsx`
- Traductions communes : `translations.fr[...]` / `translations.en[...]`
- Chaque page récupère une fonction `t` depuis le hook `useMemo`.
- Ajoutez les clés avant d’utiliser `t('nav.team')`, `t('roles.helper')`, etc.
- Le toggle se trouve dans l’entête (même logique que la console Ops).

## 3. Landing & portail React (`/`, `/app/react`)

- Ces surfaces restent majoritairement en français, mais vous pouvez réutiliser la même approche :
  - Créez un objet `translations`.
  - Utilisez un contexte ou des hooks pour exposer `t`.
  - Reprenez les mêmes clés lorsque vous copiez un écran Flutter vers React pour conserver la parité.

## 4. App Expo (`mobile/lineup-app`)

- Les traductions critiques (boutons, CTA, messages d’erreur) se trouvent dans les composants eux-mêmes.
- Pour garantir la parité avec Flutter, utilisez les mêmes libellés qu’en français puis, si nécessaire, créez un dictionnaire à l’image des consoles web.
- Les notifications et toasts héritent déjà de chaînes FR ; ajoutez vos versions EN avant la sortie internationale.

## 5. Bonnes pratiques

- **Toujours** fournir la traduction anglaise lors de l’ajout d’une clé.
- Utilisez des clés hiérarchiques (`nav.dashboard`, `table.mission`, `toast.broadcastError`) pour rester cohérent.
- Préférez les placeholders (`{count}`, `{name}`) plutôt que la concaténation.
- Quand le fallback anglais n’est pas souhaité, fournissez un `fallback` explicite à la fonction `t`.
- Documentez vos nouvelles clés dans vos MR/PR et, si elles sont partagées entre web et mobile, créez un fichier commun dans `shared/design/`.

En cas de doute, exécutez `npm run build` pour vérifier que Vite rebundle correctement après vos ajouts, puis testez les deux locales (FR/EN) directement dans `/ops` et `/admin`.
