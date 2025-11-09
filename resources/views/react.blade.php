@php
    $entry = $entry ?? 'resources/js/app.jsx';
    $title = $title ?? config('app.name', 'LineUp');
    $rootId = $rootId ?? 'react-root';
    $payload = $payload ?? [];
    $dataAttributes = collect($dataAttributes ?? [])->map(function ($value, $key) {
        $escapedKey = e($key);
        $escapedValue = e($value);
        return "data-{$escapedKey}=\"{$escapedValue}\"";
    })->implode(' ');
@endphp
<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ $title }}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    </head>
    <body>
        <div id="{{ $rootId }}" {!! $dataAttributes !!}></div>
        @if (!empty($payload))
            <script>
                window.__PAYLOAD__ = @json($payload);
            </script>
        @endif
        @viteReactRefresh
        <script type="module">
            if (import.meta?.hot && !window.__vite_plugin_react_preamble_installed__) {
                window.__vite_plugin_react_preamble_installed__ = true;
                window.$RefreshReg$ = () => {};
                window.$RefreshSig$ = () => type => type;
                console.warn(
                    '[LineUp] Vite React preamble was missing; applied fallback so development build keeps running.'
                );
            }
        </script>
        @vite($entry)
    </body>
</html>
