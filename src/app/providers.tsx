'use client';

// Comentando temporariamente o Chakra UI para diagnóstico
// import { CacheProvider } from '@chakra-ui/next-js';
// import { ChakraProvider } from '@chakra-ui/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // <CacheProvider>
    //   <ChakraProvider resetCSS>
        <>{children}</>
    //   </ChakraProvider>
    // </CacheProvider>
  );
} 