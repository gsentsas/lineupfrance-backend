<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use Illuminate\Database\Seeder;

class AppSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'group' => 'hero',
                'key' => 'hero',
                'label' => 'Bloc Hero (Onboarding)',
                'type' => 'json',
                'value' => [
                    'badge' => 'Nouveau sur LineUp',
                    'title' => 'Attendez moins, vivez plus.',
                    'subtitle' => 'Publiez une mission et laissez un Liner attendre à votre place.',
                    'cta' => 'Créer une mission',
                    'tagline' => 'Suivi en temps réel • Paiement sécurisé',
                    'backgroundImage' => null,
                ],
            ],
            [
                'group' => 'onboarding',
                'key' => 'onboarding_highlights',
                'label' => 'Points clés Onboarding',
                'type' => 'json',
                'value' => [
                    [
                        'title' => 'Mission en 60 secondes',
                        'description' => 'Décrivez votre besoin et publiez une mission instantanément.',
                    ],
                    [
                        'title' => 'Paiement sécurisé',
                        'description' => 'Vos paiements sont gérés via Stripe et PayPal.',
                    ],
                    [
                        'title' => 'Suivi temps réel',
                        'description' => 'Chat, notifications et tracking live du Liner.',
                    ],
                ],
            ],
            [
                'group' => 'support',
                'key' => 'support_contacts',
                'label' => 'Coordonnées Support',
                'type' => 'json',
                'value' => [
                    'email' => 'support@lineupfrance.com',
                    'phone' => '+33 1 02 03 04 05',
                    'availability' => '7j/7 • 8h - 22h',
                ],
            ],
            [
                'group' => 'payments',
                'key' => 'stripe',
                'label' => 'Stripe',
                'description' => 'Secret key, webhook, connect client id, Apple Pay merchant id.',
                'type' => 'json',
                'value' => [
                    'enabled' => false,
                    'secretKey' => null,
                    'publishableKey' => null,
                    'webhookSecret' => null,
                    'connectClientId' => null,
                    'applePayMerchantId' => null,
                ],
            ],
            [
                'group' => 'payments',
                'key' => 'paypal',
                'label' => 'PayPal',
                'description' => 'Client credentials + webhook id.',
                'type' => 'json',
                'value' => [
                    'enabled' => false,
                    'clientId' => null,
                    'secret' => null,
                    'webhookId' => null,
                    'mode' => 'sandbox',
                ],
            ],
            [
                'group' => 'payments',
                'key' => 'adyen',
                'label' => 'Adyen',
                'description' => 'API key, merchant account, HMAC key, client key.',
                'type' => 'json',
                'value' => [
                    'enabled' => false,
                    'apiKey' => null,
                    'clientKey' => null,
                    'merchantAccount' => null,
                    'hmacKey' => null,
                ],
            ],
            [
                'group' => 'payments',
                'key' => 'apple_pay',
                'label' => 'Apple Pay',
                'description' => 'Merchant certificates (identifier + PEM path).',
                'type' => 'json',
                'value' => [
                    'enabled' => false,
                    'merchantId' => null,
                    'certificatePath' => null,
                    'certificatePassword' => null,
                ],
            ],
            [
                'group' => 'payments',
                'key' => 'google_pay',
                'label' => 'Google Pay',
                'description' => 'Merchant ID + gateway merchant id.',
                'type' => 'json',
                'value' => [
                    'enabled' => false,
                    'merchantId' => null,
                    'gatewayMerchantId' => null,
                ],
            ],
            [
                'group' => 'auth',
                'key' => 'auth_google',
                'label' => 'Google Sign-In',
                'description' => 'Client IDs utilisés par le web et le mobile.',
                'type' => 'json',
                'value' => [
                    'webClientId' => env('GOOGLE_WEB_CLIENT_ID'),
                    'iosClientId' => env('GOOGLE_IOS_CLIENT_ID'),
                    'androidClientId' => env('GOOGLE_ANDROID_CLIENT_ID'),
                    'serverClientId' => env('GOOGLE_SERVER_CLIENT_ID'),
                    'clientSecret' => env('GOOGLE_OAUTH_CLIENT_SECRET'),
                ],
            ],
            [
                'group' => 'auth',
                'key' => 'auth_apple',
                'label' => 'Apple Sign-In',
                'description' => 'Service ID, team ID, key ID et secret privé.',
                'type' => 'json',
                'value' => [
                    'serviceId' => env('APPLE_SERVICE_ID'),
                    'teamId' => env('APPLE_TEAM_ID'),
                    'keyId' => env('APPLE_KEY_ID'),
                    'privateKey' => env('APPLE_PRIVATE_KEY'),
                    'redirectUri' => env('APPLE_REDIRECT_URI'),
                ],
            ],
            [
                'group' => 'auth',
                'key' => 'firebase_frontend',
                'label' => 'Firebase (Web & Mobile)',
                'description' => 'Clés publiques utilisées par les apps React/Expo.',
                'type' => 'json',
                'value' => [
                    'apiKey' => env('FIREBASE_WEB_API_KEY'),
                    'authDomain' => env('FIREBASE_WEB_AUTH_DOMAIN'),
                    'projectId' => env('FIREBASE_PROJECT_ID', env('FIREBASE_PROJECT')),
                    'storageBucket' => env('FIREBASE_WEB_STORAGE_BUCKET'),
                    'messagingSenderId' => env('FIREBASE_WEB_MESSAGING_SENDER_ID'),
                    'appId' => env('FIREBASE_WEB_APP_ID'),
                    'measurementId' => env('FIREBASE_WEB_MEASUREMENT_ID'),
                    'vapidKey' => env('FIREBASE_WEB_VAPID_KEY'),
                ],
            ],
        ];

        foreach ($settings as $setting) {
            AppSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
