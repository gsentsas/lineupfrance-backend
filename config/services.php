<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
        'publishable_key' => env('STRIPE_KEY'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'connect_client_id' => env('STRIPE_CONNECT_CLIENT_ID'),
        'apple_pay_merchant_id' => env('APPLE_PAY_MERCHANT_ID'),
        'enabled' => false,
    ],

    'paypal' => [
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'secret' => env('PAYPAL_SECRET'),
        'webhook_id' => env('PAYPAL_WEBHOOK_ID'),
        'mode' => env('PAYPAL_MODE', 'sandbox'),
        'enabled' => false,
    ],

    'adyen' => [
        'api_key' => env('ADYEN_API_KEY'),
        'client_key' => env('ADYEN_CLIENT_KEY'),
        'merchant_account' => env('ADYEN_MERCHANT_ACCOUNT'),
        'hmac_key' => env('ADYEN_HMAC_KEY'),
        'enabled' => false,
    ],

    'apple_pay' => [
        'merchant_id' => env('APPLE_PAY_MERCHANT_ID'),
        'certificate_path' => env('APPLE_PAY_CERTIFICATE_PATH'),
        'certificate_password' => env('APPLE_PAY_CERTIFICATE_PASSWORD'),
        'enabled' => false,
    ],

    'google_pay' => [
        'merchant_id' => env('GOOGLE_PAY_MERCHANT_ID'),
        'gateway_merchant_id' => env('GOOGLE_PAY_GATEWAY_MERCHANT_ID'),
        'enabled' => false,
    ],

    'firebase_frontend' => [
        'apiKey' => env('FIREBASE_WEB_API_KEY'),
        'authDomain' => env('FIREBASE_WEB_AUTH_DOMAIN'),
        'projectId' => env('FIREBASE_PROJECT_ID', env('FIREBASE_PROJECT')),
        'storageBucket' => env('FIREBASE_WEB_STORAGE_BUCKET'),
        'messagingSenderId' => env('FIREBASE_WEB_MESSAGING_SENDER_ID'),
        'appId' => env('FIREBASE_WEB_APP_ID'),
        'measurementId' => env('FIREBASE_WEB_MEASUREMENT_ID'),
        'vapidKey' => env('FIREBASE_WEB_VAPID_KEY'),
    ],

    'maps' => [
        'google' => [
            'api_key' => env('GOOGLE_MAPS_KEY'),
        ],
    ],

    'landing' => [
        'app_store_url' => env('LANDING_APP_STORE_URL'),
        'play_store_url' => env('LANDING_PLAY_STORE_URL'),
        'mobile_app_url' => env('LANDING_MOBILE_APP_URL'),
    ],

];
