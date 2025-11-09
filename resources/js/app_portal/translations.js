export const translations = {
  fr: {
    general: {
      localeToggle: 'EN',
      loading: 'Chargement…',
      connect: 'Se connecter',
      back: 'Retour',
      return: 'Retour',
      refresh: 'Rafraîchir',
      markAll: 'Tout marquer lu',
      markRead: 'Marquer lu',
      none: 'Aucune donnée.',
    },
    landing: {
      heroEyebrow: 'LineUp • Expérience client & liner',
      heroTitleLines: ['Attendez moins.', 'Vivez plus.'],
      heroSubtitle: 'Publiez une mission et laissez un Liner patienter à votre place.',
      previewTitle: 'Mission en direct',
      ctas: {
        role: 'Choisir mon rôle',
        login: 'Se connecter',
        mission: 'Créer une mission',
      },
      tags: ['Suivi temps réel', 'Paiement sécurisé', 'Support Ops 7/7'],
      timelineFallback: [
        { time: '09:12', label: 'Mission publiée', status: 'Créée' },
        { time: '09:18', label: 'Liner accepté', status: 'Assignée' },
        { time: '09:42', label: 'Liner en route', status: 'Tracking' },
        { time: '10:05', label: 'Preuve envoyée', status: 'Terminée' },
      ],
      actions: [
        {
          title: 'Se connecter',
          description: 'Accédez à votre espace client ou liner avec Firebase (email, Apple, Google, téléphone).',
          button: 'Accéder à la page de connexion',
        },
        {
          title: 'Créer une mission',
          description:
            'Réservé aux clients vérifiés : profil complété, paiement activé. Vous serez redirigé si besoin.',
          button: 'Lancer le process mission',
        },
        {
          title: 'Bonjour LineUp',
          description: 'Découvrez le process complet côté client, liner et Ops avec la même charte que l’app mobile.',
          button: 'Explorer les parcours',
        },
      ],
      bonjour: {
        eyebrow: 'Bonjour LineUp',
        title: 'Process répliqué à l’identique du Flutter app.',
        description:
          'Timeline mission, gestion des paiements, tutoriel Liner et centre de notifications temps réel : tout est prêt pour la bascule React/React Native.',
        primary: 'Démarrer une mission',
        secondary: 'Voir le tutoriel Liner',
      },
      highlights: [
        { title: 'Mission en 60 secondes', description: 'Décrivez votre besoin et publiez instantanément.' },
        { title: 'Paiement sécurisé', description: 'Stripe, PayPal, Apple Pay, Google Pay activables par rôle.' },
        { title: 'Chat + notifications', description: 'Chat temps réel avec preuves photo et stockage hors ligne.' },
      ],
    },
    roleChoice: {
      step: 'Étape 1/3',
      title: 'Choisissez votre expérience',
      description: 'Chaque parcours reprend le design et le process Flutter.',
      client: {
        title: 'Client',
        description: 'Publiez des missions, suivez l’attente et autorisez les paiements.',
        bullets: ['Mission en 60 secondes', 'Timeline vérifiée', 'Support Ops 7/7'],
        button: 'Continuer en tant que client',
      },
      liner: {
        title: 'Liner',
        description: 'Acceptez les missions, envoyez vos preuves d’attente et débloquez le payout.',
        bullets: ['Tutoriel interactif', 'Check-list KYC', 'Preuves photo/QR'],
        button: 'Continuer en tant que liner',
      },
    },
    auth: {
      eyebrow: 'Connexion sécurisée',
      title: 'Authentification Firebase (email, Apple, Google, téléphone).',
      email: 'Email',
      password: 'Mot de passe',
      login: 'Se connecter',
      register: 'Créer un compte',
      toggleToRegister: 'Créer un compte',
      toggleToLogin: 'J’ai déjà un compte',
      divider: 'OU',
      continueGoogle: 'Continuer avec Google',
      continueApple: 'Continuer avec Apple',
      phoneLabel: 'Numéro de téléphone (ex: +336…)',
      smsLabel: 'Code reçu par SMS',
      sendCode: 'Recevoir un code',
      confirmCode: 'Valider le code',
      errorCredentials: 'Connexion impossible, vérifiez vos identifiants.',
      errorProvider: 'Connexion impossible avec ce fournisseur.',
      errorSms: 'Impossible d’envoyer le code, vérifiez le numéro.',
      errorCode: 'Code incorrect.',
      note: 'Les visiteurs ne peuvent pas publier de mission tant qu’ils ne sont pas clients vérifiés.',
    },
    clientOnboarding: {
      title: 'Onboarding Client',
      subtitle: '3 étapes reproduites à l’identique.',
      steps: [
        {
          title: 'Profil + paiement',
          description: 'Identité, coordonnées de facturation, autorisation Stripe/PayPal.',
        },
        {
          title: 'Mission brouillon',
          description: 'Renseignez lieu, créneaux, budget avant publication.',
        },
        {
          title: 'Timeline live',
          description: 'Matching liner, preuves d’attente, capture du paiement.',
        },
      ],
      buttons: {
        dashboard: 'Ouvrir le dashboard client',
        back: 'Retour',
      },
    },
    clientDashboard: {
      title: 'Espace client',
      subtitle: 'Publiez et suivez vos missions.',
      alert: 'Sélectionnez le rôle client pour débloquer toutes les fonctionnalités.',
      buttons: {
        missions: 'Voir mes missions',
        wallet: 'Wallet & paiements',
        notifications: 'Notifications',
      },
    },
    clientMissionForm: {
      title: 'Créer une mission',
      labels: {
        title: 'Titre',
        description: 'Description',
        location: 'Lieu',
        datetime: 'Date & heure',
        duration: 'Durée (min)',
        budget: 'Budget (€)',
      },
      placeholderLocation: 'Ex: Apple Store Opéra',
      submit: 'Publier',
      messageSuccess: 'Mission créée ! Elle apparaît immédiatement dans la timeline Flutter/React.',
      messageError: 'Erreur lors de la création de mission. Vérifiez les champs ou vos prérequis (paiement/KYC).',
      alerts: {
        auth: 'Connectez-vous pour créer une mission.',
        prerequisites: 'Ajoutez un moyen de paiement et complétez votre profil client pour débloquer la création de mission.',
      },
    },
    clientMissionList: {
      title: 'Missions client',
      subtitle: 'Filtres statut + timeline détaillée.',
      alerts: {
        auth: 'Connectez-vous pour afficher vos missions.',
        role: 'Ce module est réservé aux clients.',
      },
      tabs: {
        active: 'En cours',
        completed: 'Terminées',
        cancelled: 'Annulées',
      },
      searchPlaceholder: 'Recherche (mission, lieu, liner)',
      progressLabel: 'Progression',
      reset: 'Réinitialiser',
      error: 'Impossible de charger vos missions.',
      empty: 'Aucune mission ne correspond aux filtres.',
      locationFallback: 'Lieu à préciser',
      candidates: 'candidatures',
      timelineLink: 'Ouvrir la timeline',
      detailsButton: 'Détails & chat',
    },
    missionDetail: {
      authAlert: 'Connectez-vous pour consulter la mission.',
      title: 'Timeline de mission',
      subtitle: 'Alignée sur le design Flutter.',
      back: '← Retour',
      descriptionTitle: 'Description',
      descriptionEmpty: 'Aucune description fournie.',
      labels: {
        client: 'Client',
        liner: 'Liner',
        budget: 'Budget',
        duration: 'Durée',
      },
      linerFallback: 'Non attribué',
      durationFallback: 'À confirmer',
      messageError: 'Impossible de charger la mission.',
    },
    wallet: {
      titles: {
        client: 'Wallet Client',
        liner: 'Wallet Liner',
      },
      subtitle: 'Soldes et historiques synchronisés.',
      alerts: {
        auth: 'Connectez-vous pour voir votre wallet.',
        role: 'Wallet réservé au rôle {role}.',
      },
      cards: {
        balance: 'Solde disponible',
        pending: 'En attente',
        updated: 'Mise à jour',
      },
      transactionFallback: 'Transaction',
      movementsTitle: 'Mouvements',
      movementsEmpty: 'Aucun mouvement.',
    },
    linerOnboarding: {
      title: 'Onboarding Liner',
      subtitle: 'Du tutorial au KYC.',
      steps: [
        {
          title: 'Profil & préférences',
          description: 'Bio, zones couvertes, push notifications, préférences missions.',
        },
        {
          title: 'KYC interactif',
          description: 'Pièce d’identité, selfie, justificatifs avec validations en temps réel.',
        },
        {
          title: 'Tutoriel + mission test',
          description: 'Reproduction complète de l’onboarding Flutter avec slides.',
        },
      ],
      buttons: {
        dashboard: 'Ouvrir l’espace liner',
        back: 'Retour',
      },
    },
    linerDashboard: {
      title: 'Espace liner',
      subtitle: 'Missions, tutoriel, wallet, KYC.',
      buttons: {
        missions: 'Voir les missions',
        kyc: 'Statut KYC',
        tutorial: 'Tutoriel',
        wallet: 'Wallet & payouts',
      },
    },
    linerMissions: {
      title: 'Missions liner',
      subtitle: 'Filtres assignment et progress',
      alerts: {
        auth: 'Connectez-vous côté liner pour voir les missions.',
        role: 'Réservé aux liners.',
      },
      tabs: {
        open: 'Ouvertes',
        assigned: 'Attribuées',
        completed: 'Terminées',
      },
      filters: {
        all: 'Toutes',
        mine: 'Attribuées',
        open: 'Ouvertes',
      },
      searchPlaceholder: 'Recherche mission',
      reset: 'Réinitialiser',
      error: 'Impossible de charger les missions.',
      empty: 'Aucune mission ne correspond aux filtres.',
      labels: {
        client: 'Client',
      },
      locationFallback: 'Lieu secret',
      buttons: {
        follow: 'Suivre & chat',
        proof: 'Envoyer une preuve',
      },
    },
    kyc: {
      title: 'KYC Liner',
      subtitle: 'Checklist, statut et relances Ops.',
      alerts: {
        auth: 'Réservé aux liners connectés.',
      },
      labels: {
        currentStatus: 'Statut actuel',
        lastUpdate: 'Dernière mise à jour : {value}',
        never: 'Jamais',
      },
      buttons: {
        save: 'Sauvegarder',
        submit: 'Envoyer en revue',
      },
    },
    tutorial: {
      title: 'Tutoriel Liner',
      subtitle: 'Slides identiques à l’app Flutter.',
      stepLabel: 'Étape {current}/{total}',
      completedTitle: 'Tutoriel terminé 🎉',
      completedDescription: 'Vous pouvez accepter votre première mission.',
      slides: [
        { title: 'Accepter une mission', description: 'Choisissez vos missions, voyez les infos clés et verrouillez la réservation.' },
        { title: 'Envoyer vos preuves', description: 'Photos horodatées, QR et notes vocales comme dans Flutter.' },
        { title: 'Débloquer le payout', description: 'Statut done → capture et versement selon vos réglages PSP.' },
      ],
      buttons: {
        restart: 'Recommencer',
        next: 'Étape suivante',
        goMissions: 'Aller aux missions',
      },
    },
    notifications: {
      title: 'Centre de notifications',
      subtitle: 'Flux temps réel (REST + push).',
      alertAuth: 'Connectez-vous pour voir vos notifications.',
      error: 'Impossible de charger les notifications.',
      empty: 'Aucune notification.',
      markError: 'Erreur pendant la mise à jour.',
      actions: {
        refresh: 'Rafraîchir',
        markAll: 'Tout marquer lu',
      },
    },
    chat: {
      title: 'Chat mission',
      roleLabel: {
        client: 'Côté client',
        liner: 'Côté liner',
      },
      missionPlaceholder: 'ID mission',
      messagePlaceholder: 'Écrire un message',
      empty: 'Aucun message pour cette mission.',
      attachments: {
        file: 'Fichier',
      },
      buttons: {
        send: 'Envoyer',
      },
    },
    status: {
      mission: {
        published: 'Publiée',
        accepted: 'Acceptée',
        in_progress: 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée',
      },
      progress: {
        pending: 'En attente',
        en_route: 'En route',
        arrived: 'Arrivé',
        queueing: 'En file',
        done: 'Finalisé',
        review: 'En revue',
        verified: 'Vérifié',
        not_started: 'À démarrer',
      },
      generic: {
        notAssigned: 'Non attribué',
      },
    },
    timeline: {
      steps: {
        published: { label: 'Mission publiée', description: 'Brief reçu par LineUp.' },
        assigned: { assigned: 'Liner attribué', searching: 'Recherche d’un liner', descriptionAssigned: 'Ops en cours de matching' },
        enRoute: { label: 'Liner en route', description: 'Départ confirmé' },
        queue: { label: 'Dans la file', description: 'Preuves photo/QR' },
        done: { label: 'Mission terminée', descriptionFallback: 'Paiement capturé' },
      },
    },
    missionActions: {
      title: 'Actions mission',
      subtitle: 'Autorisez le paiement, validez le QR fourni par le Liner puis laissez votre avis pour finaliser la mission.',
      paymentLabel: 'Mission LineUp',
      paymentSecretMissing: 'clientSecret Stripe manquant.',
      qrPlaceholder: '00000000-0000-0000-0000-000000000000',
      authorize: 'Autoriser le paiement',
      authorizing: 'Autorisation…',
      payWithWallet: 'Payer via Apple/Google Pay',
      paymentUnavailable: 'Bouton Apple/Google Pay indisponible sur ce navigateur.',
      qrLabel: 'Token QR fourni par le Liner',
      verify: 'Valider le QR',
      verifying: 'Validation…',
      reviewTitle: 'Avis client',
      reviewPlaceholder: 'Votre retour sur la mission',
      ratingLabel: 'Note (1-5)',
      submitReview: 'Envoyer l’avis',
      reviewBusy: 'Envoi…',
      statusSuccess: 'Action effectuée.',
      statusError: "Impossible d'exécuter cette action. Vérifiez les prérequis.",
      applePayUnavailable: "Apple/Google Pay indisponible sur ce navigateur.",
      stripeError: 'Erreur Stripe : configurez votre clé publique dans le back-office.',
      paymentUnavailableShort: "Apple/Google Pay non disponible pour l'instant.",
      paymentConfirm: 'Paiement confirmé via Apple/Google Pay.',
      paymentError: 'Impossible de finaliser le paiement via Stripe.',
    },
  },
  en: {
    general: {
      localeToggle: 'FR',
      loading: 'Loading…',
      connect: 'Sign in',
      back: 'Back',
      return: 'Back',
      refresh: 'Refresh',
      markAll: 'Mark all read',
      markRead: 'Mark read',
      none: 'No data.',
    },
    landing: {
      heroEyebrow: 'LineUp • Client & liner experience',
      heroTitleLines: ['Wait less.', 'Live more.'],
      heroSubtitle: 'Publish a mission and let a Liner queue on your behalf.',
      previewTitle: 'Live mission',
      ctas: {
        role: 'Pick my role',
        login: 'Sign in',
        mission: 'Create a mission',
      },
      tags: ['Realtime tracking', 'Secure payments', 'Ops support 24/7'],
      timelineFallback: [
        { time: '09:12', label: 'Mission published', status: 'Created' },
        { time: '09:18', label: 'Liner accepted', status: 'Assigned' },
        { time: '09:42', label: 'Liner en route', status: 'Tracking' },
        { time: '10:05', label: 'Proof uploaded', status: 'Completed' },
      ],
      actions: [
        {
          title: 'Sign in',
          description: 'Access your client or liner space with Firebase (email, Apple, Google, phone).',
          button: 'Open the login page',
        },
        {
          title: 'Create a mission',
          description: 'Clients only: complete your profile and payment first. We redirect you if required.',
          button: 'Launch the mission flow',
        },
        {
          title: 'Hello LineUp',
          description: 'Preview the entire client, liner and Ops journey with the same branding as the mobile app.',
          button: 'Explore the journeys',
        },
      ],
    },
    roleChoice: {
      step: 'Step 1/3',
      title: 'Choose your experience',
      description: 'Each flow mirrors the Flutter design and process.',
      client: {
        title: 'Client',
        description: 'Publish missions, monitor the wait and approve payments.',
        bullets: ['Mission in 60 seconds', 'Verified timeline', 'Ops support 24/7'],
        button: 'Continue as a client',
      },
      liner: {
        title: 'Liner',
        description: 'Accept missions, share proof-of-wait and unlock payouts.',
        bullets: ['Interactive tutorial', 'KYC checklist', 'Photo/QR proofs'],
        button: 'Continue as a liner',
      },
    },
    auth: {
      eyebrow: 'Secure login',
      title: 'Firebase auth (email, Apple, Google, phone).',
      email: 'Email',
      password: 'Password',
      login: 'Sign in',
      register: 'Create account',
      toggleToRegister: 'Create account',
      toggleToLogin: 'I already have an account',
      divider: 'OR',
      continueGoogle: 'Continue with Google',
      continueApple: 'Continue with Apple',
      phoneLabel: 'Phone number (e.g. +447…)',
      smsLabel: 'SMS code',
      sendCode: 'Send a code',
      confirmCode: 'Verify code',
      errorCredentials: 'Unable to sign in, please check your credentials.',
      errorProvider: 'Unable to sign in with this provider.',
      errorSms: 'Failed to send the code, please check the number.',
      errorCode: 'Invalid code.',
      note: 'Visitors cannot publish missions until they become verified clients.',
    },
    clientOnboarding: {
      title: 'Client onboarding',
      subtitle: '3 mirrored steps.',
      steps: [
        {
          title: 'Profile + payment',
          description: 'Identity, billing details, Stripe/PayPal authorization.',
        },
        {
          title: 'Draft mission',
          description: 'Fill location, slot, budget before publishing.',
        },
        {
          title: 'Live timeline',
          description: 'Liner matching, wait proofs, payment capture.',
        },
      ],
      buttons: {
        dashboard: 'Open client dashboard',
        back: 'Back',
      },
    },
    clientDashboard: {
      title: 'Client space',
      subtitle: 'Publish and monitor your missions.',
      alert: 'Select the client role to unlock every feature.',
      buttons: {
        missions: 'View missions',
        wallet: 'Wallet & payments',
        notifications: 'Notifications',
      },
    },
    clientMissionForm: {
      title: 'Create a mission',
      labels: {
        title: 'Title',
        description: 'Description',
        location: 'Location',
        datetime: 'Date & time',
        duration: 'Duration (min)',
        budget: 'Budget (€)',
      },
      placeholderLocation: 'e.g. Apple Store Opera',
      submit: 'Publish',
      messageSuccess: 'Mission created! It appears instantly in the Flutter/React timeline.',
      messageError: 'Mission creation failed. Check the fields or your prerequisites (payment/KYC).',
      alerts: {
        auth: 'Sign in to create a mission.',
        prerequisites: 'Add a payment method and complete your profile first.',
      },
    },
    clientMissionList: {
      title: 'Client missions',
      subtitle: 'Status filters + detailed timeline.',
      alerts: {
        auth: 'Sign in to view your missions.',
        role: 'This module is restricted to clients.',
      },
      tabs: {
        active: 'Active',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      searchPlaceholder: 'Search (mission, location, liner)',
      progressLabel: 'Progress',
      reset: 'Reset',
      error: 'Failed to load your missions.',
      empty: 'No mission matches the filters.',
      locationFallback: 'Location to be confirmed',
      candidates: 'applications',
      timelineLink: 'Open the timeline',
      detailsButton: 'Details & chat',
    },
    missionDetail: {
      authAlert: 'Sign in to open the mission.',
      title: 'Mission timeline',
      subtitle: 'Matches the Flutter design.',
      back: '← Back',
      descriptionTitle: 'Description',
      descriptionEmpty: 'No description provided.',
      labels: {
        client: 'Client',
        liner: 'Liner',
        budget: 'Budget',
        duration: 'Duration',
      },
      linerFallback: 'Unassigned',
      durationFallback: 'To be confirmed',
      messageError: 'Unable to load this mission.',
    },
    wallet: {
      titles: {
        client: 'Client wallet',
        liner: 'Liner wallet',
      },
      subtitle: 'Synced balances and history.',
      alerts: {
        auth: 'Sign in to view your wallet.',
        role: 'Wallet reserved for the {role} role.',
      },
      cards: {
        balance: 'Available balance',
        pending: 'Pending',
        updated: 'Updated at',
      },
      transactionFallback: 'Transaction',
      movementsTitle: 'Transactions',
      movementsEmpty: 'No transaction yet.',
    },
    linerOnboarding: {
      title: 'Liner onboarding',
      subtitle: 'From tutorial to KYC.',
      steps: [
        {
          title: 'Profile & preferences',
          description: 'Bio, coverage areas, push notifications, mission preferences.',
        },
        {
          title: 'Interactive KYC',
          description: 'ID, selfie, proofs with realtime validation.',
        },
        {
          title: 'Tutorial + test mission',
          description: 'Exact same onboarding flow as Flutter.',
        },
      ],
      buttons: {
        dashboard: 'Open liner space',
        back: 'Back',
      },
    },
    linerDashboard: {
      title: 'Liner space',
      subtitle: 'Missions, tutorial, wallet, KYC.',
      buttons: {
        missions: 'View missions',
        kyc: 'KYC status',
        tutorial: 'Tutorial',
        wallet: 'Wallet & payouts',
      },
    },
    linerMissions: {
      title: 'Liner missions',
      subtitle: 'Assignment & progress filters',
      alerts: {
        auth: 'Sign in as a liner to view missions.',
        role: 'Liners only.',
      },
      tabs: {
        open: 'Open',
        assigned: 'Assigned',
        completed: 'Completed',
      },
      filters: {
        all: 'All',
        mine: 'Assigned',
        open: 'Open',
      },
      searchPlaceholder: 'Search mission',
      reset: 'Reset',
      error: 'Unable to load missions.',
      empty: 'No missions match the filters.',
      labels: {
        client: 'Client',
      },
      locationFallback: 'Hidden location',
      buttons: {
        follow: 'Follow & chat',
        proof: 'Upload a proof',
      },
    },
    kyc: {
      title: 'Liner KYC',
      subtitle: 'Checklist, status and Ops follow-ups.',
      alerts: {
        auth: 'Reserved for signed-in liners.',
      },
      labels: {
        currentStatus: 'Current status',
        lastUpdate: 'Last update: {value}',
        never: 'Never',
      },
      buttons: {
        save: 'Save',
        submit: 'Submit for review',
      },
    },
    tutorial: {
      title: 'Liner tutorial',
      subtitle: 'Same slides as the Flutter app.',
      stepLabel: 'Step {current}/{total}',
      completedTitle: 'Tutorial completed 🎉',
      completedDescription: 'You can accept your first mission.',
      slides: [
        { title: 'Accept a mission', description: 'Pick missions, review key info and lock the booking.' },
        { title: 'Send your proofs', description: 'Timestamped photos, QR and voice notes just like Flutter.' },
        { title: 'Unlock payouts', description: 'Done status → capture and payout based on your PSP settings.' },
      ],
      buttons: {
        restart: 'Restart',
        next: 'Next step',
        goMissions: 'Go to missions',
      },
    },
    notifications: {
      title: 'Notifications center',
      subtitle: 'Realtime feed (REST + push).',
      alertAuth: 'Sign in to view your notifications.',
      error: 'Failed to load notifications.',
      empty: 'No notification yet.',
      markError: 'Update failed.',
      actions: {
        refresh: 'Refresh',
        markAll: 'Mark all read',
      },
    },
    chat: {
      title: 'Mission chat',
      roleLabel: {
        client: 'Client side',
        liner: 'Liner side',
      },
      missionPlaceholder: 'Mission ID',
      messagePlaceholder: 'Write a message',
      empty: 'No message for this mission.',
      attachments: {
        file: 'File',
      },
      buttons: {
        send: 'Send',
      },
    },
    status: {
      mission: {
        published: 'Published',
        accepted: 'Accepted',
        in_progress: 'In progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      progress: {
        pending: 'Pending',
        en_route: 'On the way',
        arrived: 'Arrived',
        queueing: 'In line',
        done: 'Done',
        review: 'Under review',
        verified: 'Verified',
        not_started: 'Not started',
      },
      generic: {
        notAssigned: 'Unassigned',
      },
    },
    timeline: {
      steps: {
        published: { label: 'Mission published', description: 'Brief received by LineUp.' },
        assigned: { assigned: 'Liner assigned', searching: 'Searching for a liner', descriptionAssigned: 'Ops matching in progress' },
        enRoute: { label: 'Liner en route', description: 'Departure confirmed' },
        queue: { label: 'In line', description: 'Photo/QR proofs' },
        done: { label: 'Mission completed', descriptionFallback: 'Payment captured' },
      },
    },
    missionActions: {
      title: 'Mission actions',
      subtitle: 'Authorize the payment, validate the liner QR, then leave your feedback to close the mission.',
      paymentLabel: 'LineUp mission',
      paymentSecretMissing: 'Stripe clientSecret missing.',
      qrPlaceholder: '00000000-0000-0000-0000-000000000000',
      authorize: 'Authorize payment',
      authorizing: 'Authorizing…',
      payWithWallet: 'Pay with Apple/Google Pay',
      paymentUnavailable: 'Apple/Google Pay button unavailable on this browser.',
      qrLabel: 'QR token provided by the liner',
      verify: 'Validate the QR',
      verifying: 'Verifying…',
      reviewTitle: 'Client review',
      reviewPlaceholder: 'Share your feedback',
      ratingLabel: 'Rating (1-5)',
      submitReview: 'Submit review',
      reviewBusy: 'Submitting…',
      statusSuccess: 'Action completed.',
      statusError: 'Unable to run this action. Check the prerequisites.',
      applePayUnavailable: 'Apple/Google Pay unavailable in this browser.',
      stripeError: 'Stripe error: configure your publishable key in the back-office.',
      paymentUnavailableShort: 'Apple/Google Pay currently unavailable.',
      paymentConfirm: 'Payment confirmed via Apple/Google Pay.',
      paymentError: 'Unable to finalize the payment via Stripe.',
    },
  },
};

function resolvePath(dictionary, path) {
  if (!path) {
    return undefined;
  }
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dictionary);
}

export function createTranslator(locale = 'fr') {
  return function translate(path, fallback) {
    const localeDict = translations[locale] ?? translations.fr;
    const result = resolvePath(localeDict, path);
    if (result !== undefined) {
      return result;
    }
    const fallbackValue = resolvePath(translations.fr, path);
    return fallbackValue !== undefined ? fallbackValue : fallback;
  };
}

export function formatTemplate(template, params = {}) {
  if (typeof template !== 'string') {
    return template ?? '';
  }
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template,
  );
}
