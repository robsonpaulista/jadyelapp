"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, X } from 'lucide-react';

export default function PWAHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    userAgent: '',
    isMobile: false,
    isChrome: false,
    swRegistered: false,
    manifestFound: false,
    httpsActive: false,
    deferredPromptAvailable: false,
    status: 'Iniciando...'
  });

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOSDevice = /ipad|iphone|ipod/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edg|edge/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|chromium|edg|edge/.test(userAgent);
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
    
    const httpsActive = location.protocol === 'https:' || 
                       location.hostname === 'localhost' || 
                       location.hostname === '127.0.0.1' ||
                       location.hostname.includes('192.168.');

    setIsIOS(isIOSDevice);
    setIsStandalone(isStandaloneMode);

    // Atualizar debug info
    const updateDebugInfo = (swRegistered: boolean, manifestFound: boolean, deferredPromptAvailable: boolean, status: string) => {
      setDebugInfo({
        userAgent,
        isMobile,
        isChrome,
        swRegistered,
        manifestFound,
        httpsActive,
        deferredPromptAvailable,
        status
      });
    };

    // Função principal para testar PWA
    const testPWA = async () => {
      try {
        updateDebugInfo(false, false, false, 'Testando manifest...');
        
        // Testar manifest
        const manifestResponse = await fetch('/manifest.json');
        const manifestOk = manifestResponse.ok;
        
        if (!manifestOk) {
          updateDebugInfo(false, false, false, 'Manifest falhou');
          return;
        }
        
        updateDebugInfo(false, true, false, 'Testando service worker...');
        
        // Testar service worker
        if (!('serviceWorker' in navigator)) {
          updateDebugInfo(false, true, false, 'SW não suportado');
          return;
        }
        
        // Registrar SW com melhor tratamento de erros
        try {
          // Primeiro, verifica se já existe um registro
          const existingRegistration = await navigator.serviceWorker.getRegistration();
          
          if (existingRegistration) {
            // Se existe, atualiza
            await existingRegistration.update();
            updateDebugInfo(true, true, false, 'SW atualizado! Aguardando ativação...');
          } else {
            // Se não existe, registra novo
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
              updateViaCache: 'none'
            });
            updateDebugInfo(true, true, false, 'SW registrado! Aguardando ativação...');
          }

          // Monitora o estado do SW
          navigator.serviceWorker.ready.then((registration) => {
            if (registration.active) {
              updateDebugInfo(true, true, deferredPrompt !== null, 'SW ativo!');
              
              // Adiciona listener para atualizações
              registration.addEventListener('controllerchange', () => {
                updateDebugInfo(true, true, deferredPrompt !== null, 'SW atualizado e ativo!');
              });
            }
          });

          // Monitora erros do SW
          navigator.serviceWorker.addEventListener('error', (event) => {
            console.error('Erro no SW:', event);
            updateDebugInfo(false, true, false, 'Erro no Service Worker');
          });

        } catch (error) {
          console.error('Erro ao registrar SW:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          updateDebugInfo(false, true, false, `Erro no SW: ${errorMessage}`);
          
          // Tenta limpar registros problemáticos
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            await registration.unregister();
          }
        }
        
      } catch (error) {
        updateDebugInfo(false, false, false, `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    };

    // Event listeners
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      updateDebugInfo(debugInfo.swRegistered, debugInfo.manifestFound, true, 'Event capturado!');
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Iniciar teste
    testPWA();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
      } else {
        setShowAndroidInstructions(true);
      }
      return;
    }

    try {
      const result = await deferredPrompt.prompt();
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Debug Box */}
      <div className="bg-gray-900 text-white text-xs p-3 rounded-lg shadow-lg max-w-sm">
        <div className="font-bold mb-2">🔧 PWA Debug</div>
        <div>📱 {debugInfo.isMobile ? 'Mobile' : 'Desktop'} | {isIOS ? 'iOS' : 'Android'}</div>
        <div>🌐 {debugInfo.isChrome ? 'Chrome' : 'Outro'}</div>
        <div>🔒 HTTPS: {debugInfo.httpsActive ? '✅' : '❌'}</div>
        <div>📄 Manifest: {debugInfo.manifestFound ? '✅' : '❌'}</div>
        <div>⚙️ SW: {debugInfo.swRegistered ? '✅' : '❌'}</div>
        <div>🎯 Event: {debugInfo.deferredPromptAvailable ? '✅' : '❌'}</div>
        <div className="mt-2 text-yellow-300">📋 {debugInfo.status}</div>
        
        <button 
          onClick={handleRetry}
          className="mt-2 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Recarregar
        </button>
      </div>

      {/* Botão de Instalação */}
      {(isInstallable || (!isInstallable && debugInfo.isMobile)) && (
        <Button
          onClick={handleInstallClick}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2"
          size="sm"
        >
          <Download className="h-4 w-4" />
          {isInstallable ? 'Instalar App' : 'Como Instalar'}
        </Button>
      )}

      {/* Instruções iOS */}
      {showIOSInstructions && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm">📱 Instalar no iOS</h3>
            <button onClick={() => setShowIOSInstructions(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="text-xs space-y-1 list-decimal list-inside">
            <li>Toque no botão de compartilhar (📤)</li>
            <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
            <li>Toque em "Adicionar"</li>
          </ol>
        </div>
      )}

      {/* Instruções Android */}
      {showAndroidInstructions && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm">📱 Instalar no Android</h3>
            <button onClick={() => setShowAndroidInstructions(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="text-xs space-y-1 list-decimal list-inside">
            <li>Toque no menu do Chrome (⋮)</li>
            <li>Procure por "Instalar aplicativo"</li>
            <li>Aguarde alguns segundos e recarregue se necessário</li>
          </ol>
        </div>
      )}
    </div>
  );
} 