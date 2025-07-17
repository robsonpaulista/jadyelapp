'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Monitor, Users, BarChart3, Settings, Sparkles, Zap, Target, Rocket } from 'lucide-react';
import Image from 'next/image';

export default function ApplicationsDashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';
    setIsLoaded(true);
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
    };
  }, []);

  const slides = [
    {
      id: 1,
      icon: Monitor,
      decorativeIcons: [Sparkles, Zap, Target],
      title: "Hub de Aplicações",
      subtitle: "Dep.Federal Jadyel Alencar",
      tagline: "Portal Integrado de Gestão",
      description: "Plataforma tecnológica avançada que centraliza todas as ferramentas essenciais para uma gestão política e administrativa de excelência.",
      features: ["Monitoramento de mídia em tempo real", "Base de lideranças integrada", "Análise de cenários políticos", "Formação de chapas 2026"],
      gradient: "from-orange-500 via-red-500 to-pink-600",
      accentColor: "orange"
    },
    {
      id: 2,
      icon: BarChart3,
      decorativeIcons: [Target, Zap, Rocket],
      title: "Analytics Avançado",
      subtitle: "Dados e Insights",
      tagline: "Inteligência de Dados",
      description: "Sistema de analytics de última geração para análise profunda de dados eleitorais, pesquisas e projeções estratégicas.",
      features: ["Pesquisas eleitorais detalhadas", "Análise preditiva de tendências", "Projeções municipais IA", "Dashboards interativos"],
      gradient: "from-orange-500 via-red-500 to-pink-600",
      accentColor: "orange"
    },
    {
      id: 3,
      icon: Settings,
      decorativeIcons: [Rocket, Sparkles, Target],
      title: "Gestão Inteligente",
      subtitle: "Recursos e Controle",
      tagline: "Automação Administrativa",
      description: "Suite completa de ferramentas para gestão automatizada de emendas, obras públicas e recursos governamentais.",
      features: ["Gestão automatizada de emendas", "Controle inteligente de obras", "Dashboard de municípios", "Workflow de demandas"],
      gradient: "from-orange-500 via-red-500 to-pink-600",
      accentColor: "orange"
    },
    {
      id: 4,
      icon: Users,
      decorativeIcons: [Zap, Target, Sparkles],
      title: "Social Intelligence",
      subtitle: "Redes e Engajamento",
      tagline: "Comunicação Digital",
      description: "Plataforma de inteligência social com análise avançada de redes sociais e estratégias de comunicação digital.",
      features: ["Instagram Analytics Pro", "Métricas de engajamento IA", "Monitoramento de sentimentos", "Estratégias automatizadas"],
      gradient: "from-orange-500 via-red-500 to-pink-600",
      accentColor: "orange"
    }
  ];

  // Auto-advance slides every 15 seconds
  useEffect(() => {
    if (!isPaused && isLoaded) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isPaused, isLoaded, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-2 sm:left-10 w-32 h-32 sm:w-72 sm:h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-32 right-2 sm:right-20 w-40 h-40 sm:w-96 sm:h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-32 h-32 sm:w-80 sm:h-80 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>

      {/* Main Content Area */}
      <main className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col">
          {/* Carousel Container */}
          <div 
            className="flex-1 relative overflow-hidden min-h-screen"
          >
            {/* Slides */}
            <div 
              className="absolute inset-0 flex transition-transform duration-1000 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => {
                const IconComponent = slide.icon;
                const isActive = currentSlide === index;
                
                return (
                  <div
                    key={slide.id}
                    className="min-w-full h-full relative bg-white"
                  >
                    {/* Content */}
                    <div 
                      className="relative z-10 flex flex-col justify-between min-h-screen pt-16 sm:pt-24 lg:pt-36"
                      onMouseEnter={() => setIsPaused(true)}
                      onMouseLeave={() => setIsPaused(false)}
                    >
                      {/* Main Content */}
              <div className="flex-1">
                        <div className="max-w-none mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 w-full">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 xl:gap-10 items-start max-w-7xl mx-auto w-full">
                            {/* Text Content */}
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6 order-2 lg:order-1">
                              {/* Header without icon */}
                              <div className="space-y-2 sm:space-y-3">
                                <div>
                                  <p className={`text-xs sm:text-sm font-bold text-${slide.accentColor}-600 uppercase tracking-widest mb-1 sm:mb-2 transform transition-all duration-500 ${isActive ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                                    {slide.tagline}
                                  </p>
                                  <h1 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent transform transition-all duration-700 leading-tight ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                                    {slide.title}
                                  </h1>
                                  <h2 className={`text-base sm:text-lg md:text-xl font-bold text-gray-700 transform transition-all duration-700 delay-200 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                                    {slide.subtitle}
                                  </h2>
              </div>
                                
                                <p className={`text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed transform transition-all duration-700 delay-300 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                                  {slide.description}
                                </p>
          </div>

                              {/* Features List with staggered animation */}
                              <div className="space-y-1 sm:space-y-2">
                                {slide.features.map((feature, featureIndex) => (
                                  <div 
                                    key={featureIndex}
                                    className={`flex items-center space-x-3 sm:space-x-4 group transform transition-all duration-500 ${isActive ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                                    style={{
                                      transitionDelay: isActive ? `${400 + featureIndex * 150}ms` : '0ms'
                                    }}
                                  >
                                    <div className={`relative w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r ${slide.gradient} shadow-lg group-hover:scale-125 transition-transform duration-300 flex-shrink-0`}>
                                      <div className="absolute inset-0 rounded-full bg-white/30 animate-ping group-hover:animate-none"></div>
              </div>
                                    <span className="text-sm sm:text-base font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-300 leading-snug">{feature}</span>
              </div>
                                ))}
            </div>
          </div>

                            {/* Visual Element */}
                            <div className="flex justify-center items-start pt-2 sm:pt-4 relative lg:order-2 order-1">
                              {/* Conditional rendering for slides with images */}
                              {index === 0 ? (
                                // First slide with new image
                                <div className={`relative transform transition-all duration-1000 ${isActive ? 'scale-100 rotate-0' : 'scale-90 rotate-12'}`}>
                                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl">
                                    <Image
                                      src="/imagemcarrossel3.jpg"
                                      alt="Hub de Aplicações"
                                      width={256}
                                      height={256}
                                      className="w-full h-full object-cover"
                                      priority
                                    />
                                    {/* Overlay with gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-20`}></div>
              </div>
            </div>
                              ) : index === 1 ? (
                                // Second slide with image
                                <div className={`relative transform transition-all duration-1000 ${isActive ? 'scale-100 rotate-0' : 'scale-90 rotate-12'}`}>
                                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl">
                                    <Image
                                      src="/imagemcarrossel2.jpg"
                                      alt="Analytics Avançado"
                                      width={256}
                                      height={256}
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Overlay with gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-20`}></div>
            </div>
          </div>
                              ) : index === 2 ? (
                                // Third slide with original first image
                                <div className={`relative transform transition-all duration-1000 ${isActive ? 'scale-100 rotate-0' : 'scale-90 rotate-12'}`}>
                                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl">
                                    <Image
                                      src="/imagemcarrossel.jpg"
                                      alt="Gestão Inteligente"
                                      width={256}
                                      height={256}
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Overlay with gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-20`}></div>
              </div>
            </div>
                              ) : index === 3 ? (
                                // Fourth slide with image
                                <div className={`relative transform transition-all duration-1000 ${isActive ? 'scale-100 rotate-0' : 'scale-90 rotate-12'}`}>
                                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl">
                                    <Image
                                      src="/imagemcarrossel4.jpg"
                                      alt="Social Intelligence"
                                      width={256}
                                      height={256}
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Overlay with gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-20`}></div>
            </div>
          </div>
                              ) : (
                                // Other slides with icon circles
                                <>
                                  {/* Main icon container */}
                                  <div className={`relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full bg-gradient-to-br ${slide.gradient} opacity-10 flex items-center justify-center transform transition-all duration-1000 ${isActive ? 'scale-100 rotate-0' : 'scale-90 rotate-12'}`}>
                                    <div className={`w-32 h-32 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-60 lg:h-60 rounded-full bg-gradient-to-br ${slide.gradient} opacity-20 flex items-center justify-center animate-pulse`}>
                                      <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br ${slide.gradient} opacity-30 flex items-center justify-center`}>
                                        <IconComponent className={`h-8 w-8 sm:h-10 sm:w-10 md:h-16 md:w-16 lg:h-20 lg:w-20 text-gray-500 transform transition-all duration-1000 ${isActive ? 'scale-110' : 'scale-100'}`} />
              </div>
              </div>
            </div>
                                </>
                              )}
                              
                              {/* Floating decorative icons - only on large screens */}
                              {slide.decorativeIcons.map((DecorativeIcon, iconIndex) => (
                                <div
                                  key={iconIndex}
                                  className={`absolute animate-bounce transform transition-all duration-1000 hidden lg:block ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                                  style={{
                                    top: `${25 + iconIndex * 25}%`,
                                    left: `-7%`,
                                    animationDelay: `${iconIndex * 500}ms`,
                                    animationDuration: '2s'
                                  }}
                                >
                                  <div className={`p-2 rounded-lg bg-gradient-to-br ${slide.gradient} shadow-lg`}>
                                    <DecorativeIcon className="h-4 w-4 text-white" />
            </div>
          </div>
                              ))}
              </div>
            </div>
          </div>

                        {/* Controls Area */}
                        <div className="w-full">
                          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
                            <div className="py-4 sm:py-6 lg:py-8">
                              <div className="flex justify-center items-center">
                                <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                                  {/* Previous Button */}
                                  <button
                                    onClick={prevSlide}
                                    className="p-2 sm:p-3 rounded-full bg-white/90 backdrop-blur-md border border-orange-200 shadow-xl hover:bg-orange-500 hover:border-orange-400 transition-all duration-300 group hover:scale-110"
                                  >
                                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 group-hover:text-white transition-colors duration-300" />
                                  </button>

                                  {/* Slide Indicators */}
                                  <div className="flex space-x-2 sm:space-x-3 lg:space-x-4">
                                    {slides.map((slide, index) => (
                                      <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`relative group transition-all duration-300 ${
                                          currentSlide === index ? 'scale-110' : 'hover:scale-105'
                                        }`}
                                      >
                                        <div className={`w-8 h-2 sm:w-12 sm:h-3 lg:w-16 lg:h-3 rounded-full transition-all duration-300 relative overflow-hidden ${
                                          currentSlide === index
                                            ? `bg-gradient-to-r ${slide.gradient} shadow-lg`
                                            : 'bg-white/20 hover:bg-white/30'
                                        }`}>
                                          {/* Base layer for all slides */}
                                          <div className="absolute inset-0 bg-black/5 rounded-full"></div>
                                          {/* Progress animation only for current slide */}
                                          {currentSlide === index && (
                                            <div 
                                              className="absolute inset-0 bg-white/20 rounded-full origin-left"
                                              style={{
                                                animation: !isPaused ? 'progress 15s linear' : 'none'
                                              }}
                                            ></div>
                                          )}
              </div>
                                        {/* Slide preview on hover - only on larger screens */}
                                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden sm:block">
                                          <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap">
                                            {slide.title}
              </div>
            </div>
                                      </button>
                                    ))}
          </div>

                                  {/* Next Button */}
                                  <button
                                    onClick={nextSlide}
                                    className="p-2 sm:p-3 rounded-full bg-white/90 backdrop-blur-md border border-orange-200 shadow-xl hover:bg-orange-500 hover:border-orange-400 transition-all duration-300 group hover:scale-110"
                                  >
                                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 group-hover:text-white transition-colors duration-300" />
                                  </button>
              </div>
              </div>
            </div>
            </div>
          </div>
              </div>
              </div>
            </div>
                );
              })}
            </div>
          </div>

          {/* Controls Area */}
          {/* This section is now moved inside the slide content */}
        </div>
      </main>

      <style jsx>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
} 