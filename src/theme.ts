import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

// Theme-Konfiguration für das Dart-Turnier-Management
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#e8f5e8',
      100: '#c8e6c8',
      200: '#a8d7a8',
      300: '#88c888',
      400: '#68b968',
      500: '#4CAF50', // Primary Green
      600: '#45a049',
      700: '#3d8b40',
      800: '#357a35',
      900: '#2d692d',
    },
    dart: {
      primary: '#4CAF50',
      secondary: '#2196F3',
      accent: '#FF9800',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    }
  },
  fonts: {
    heading: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
    body: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        minH: '100vh',
        color: 'blue.900', // Dunkles Blau für Text
      },
      // Überschreibe auch andere Text-Elemente
      'h1, h2, h3, h4, h5, h6': {
        color: 'blue.800',
      },
      p: {
        color: 'blue.700',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
        _focus: {
          boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.3)',
        },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        dart: {
          bg: 'linear-gradient(135deg, #4CAF50, #45a049)',
          color: 'white',
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'xl',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          color: 'blue.800', // Dunkles Blau für Input-Text
        },
      },
      variants: {
        filled: {
          field: {
            bg: 'gray.50',
            color: 'blue.800', // Dunkles Blau für Input-Text
            _hover: {
              bg: 'gray.100',
            },
            _focus: {
              bg: 'white',
              borderColor: 'blue.500', // Blaue Fokus-Farbe
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)', // Blaue Fokus-Shadow
              color: 'blue.900', // Noch dunkleres Blau bei Fokus
            },
            _placeholder: {
              color: 'blue.400', // Helleres Blau für Placeholder
            },
          },
        },
        outline: {
          field: {
            color: 'blue.800',
            borderColor: 'blue.200',
            _hover: {
              borderColor: 'blue.300',
            },
            _focus: {
              borderColor: 'blue.500',
              boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.6)',
              color: 'blue.900',
            },
            _placeholder: {
              color: 'blue.400',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Table: {
      variants: {
        dart: {
          table: {
            borderRadius: 'md',
            overflow: 'hidden',
          },
          th: {
            bg: 'gray.50',
            borderColor: 'gray.200',
            fontWeight: 'bold',
            color: 'blue.800', // Dunkles Blau für Tabellen-Header
          },
          td: {
            borderColor: 'gray.100',
            color: 'blue.700', // Dunkles Blau für Tabellen-Zellen
          },
        },
      },
    },
    // Weitere Text-Komponenten mit dunklem Blau
    Text: {
      baseStyle: {
        color: 'red.500',
      },
    },
    Heading: {
      baseStyle: {
        color: 'blue.800',
      },
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
        },
        title: {
          color: 'red.600', // Rot-Orange für Titel
          fontWeight: 'bold',
        },
        description: {
          color: 'orange.600', // Orange für Beschreibung
        },
        icon: {
          color: 'red.500', // Rot für Icon
        },
      },
      variants: {
        subtle: {
          container: {
            bg: 'blue.500', // Dunkelblauer Hintergrund
            borderLeft: '4px solid',
            borderLeftColor: 'red.400', // Rot Border
          },
          title: {
            color: 'red.700', // Rot für Titel
          },
          description: {
            color: 'orange.700', // Orange für Beschreibung
          },
          icon: {
            color: 'red.500', // Rot für Icon
          },
        },
        'left-accent': {
          container: {
            borderLeft: '4px solid',
            borderLeftColor: 'red.500', // Rot-Orange Border
            bg: 'blue.500', // Dunkelblauer Hintergrund
          },
          title: {
            color: 'red.700', // Rot für Titel
          },
          description: {
            color: 'orange.700', // Orange für Beschreibung
          },
          icon: {
            color: 'red.500', // Rot für Icon
          },
        },
        solid: {
          container: {
            bg: 'blue.500',
            color: 'red',
          },
          title: {
            color: 'white',
          },
          description: {
            color: 'red',
          },
          icon: {
            color: 'white',
          },
        },
      },
      defaultProps: {
        variant: 'left-accent',
      },
    },
  },
})

export default theme