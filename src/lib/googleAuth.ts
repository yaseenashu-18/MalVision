export interface GoogleUserProfile {
  name: string;
  email: string;
  avatar?: string;
  sub?: string;
  emailVerified?: boolean;
  provider: 'google';
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: { 
            isNotDisplayed: () => boolean; 
            getNotDisplayedReason: () => string;
            isSkippedMoment: () => boolean;
            getSkippedReason: () => string;
            isDismissedMoment: () => boolean;
            getDismissedReason: () => string;
          }) => void) => void;
          renderButton: (
            parent: HTMLElement, 
            options: { theme?: 'outline' | 'filled_blue' | 'filled_black'; size?: 'large' | 'medium' | 'small'; width?: number; shape?: 'rectangular' | 'pill'; logo_alignment?: 'left' | 'center' }
          ) => void;
        };
      };
    };
  }
}

export const GOOGLE_CLIENT_ID = 
  (import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) || 
  '674911223359-kadmn3hpm7toikruvthniveaepnphv11.apps.googleusercontent.com';

/**
 * Decodes a Google OAuth JWT Credential token safely to extract real Google user profile data
 */
export function decodeGoogleJwt(token: string): Partial<GoogleUserProfile> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      name: parsed.name || parsed.given_name || 'Google User',
      email: parsed.email,
      avatar: parsed.picture,
      sub: parsed.sub,
      emailVerified: parsed.email_verified,
      provider: 'google',
    };
  } catch (e) {
    console.error('Error parsing Google OAuth JWT token:', e);
    return null;
  }
}

/**
 * Loads the Google Identity Services Client SDK script dynamically
 */
export function loadGoogleSdk(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Google Identity Services SDK script failed to load.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Renders the official Google Sign-In Button on a given DOM container element
 */
export async function renderGoogleSignInButton(
  container: HTMLElement,
  onSuccess: (user: GoogleUserProfile) => void,
  onError?: (errMessage: string) => void
): Promise<boolean> {
  const loaded = await loadGoogleSdk();
  const googleId = window.google?.accounts?.id;
  if (!loaded || !googleId) {
    onError?.('Google Identity Services SDK failed to initialize.');
    return false;
  }

  try {
    googleId.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          const decoded = decodeGoogleJwt(response.credential);
          if (decoded && decoded.email) {
            onSuccess({
              name: decoded.name || 'Google User',
              email: decoded.email,
              avatar: decoded.avatar,
              sub: decoded.sub,
              emailVerified: decoded.emailVerified,
              provider: 'google',
            });
            return;
          }
        }
        onError?.('Google authentication returned invalid credentials.');
      },
    });

    // Clear previous button content
    container.innerHTML = '';
    googleId.renderButton(container, {
      theme: 'filled_black',
      size: 'large',
      width: 280,
      shape: 'pill',
      logo_alignment: 'left',
    });

    return true;
  } catch (err: any) {
    console.error('Failed to render Google Sign-In button:', err);
    onError?.(err?.message || 'Failed to render Google Sign-In button.');
    return false;
  }
}

/**
 * Performs explicit Google OAuth Prompt authentication.
 * No hardcoded dummy fallbacks are used. Real token or explicit failure.
 */
export async function authenticateWithGoogle(): Promise<GoogleUserProfile> {
  const loaded = await loadGoogleSdk();
  const googleId = window.google?.accounts?.id;
  if (!loaded || !googleId) {
    throw new Error('Google Identity Services SDK failed to load.');
  }

  return new Promise((resolve, reject) => {
    try {
      googleId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            const decoded = decodeGoogleJwt(response.credential);
            if (decoded && decoded.email) {
              resolve({
                name: decoded.name || 'Google User',
                email: decoded.email,
                avatar: decoded.avatar,
                sub: decoded.sub,
                emailVerified: decoded.emailVerified,
                provider: 'google',
              });
              return;
            }
          }
          reject(new Error('Google authentication returned no credentials.'));
        },
      });

      googleId.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
          let reason = 'closed';
          if (notification.isNotDisplayed()) reason = notification.getNotDisplayedReason();
          else if (notification.isSkippedMoment()) reason = notification.getSkippedReason();
          else if (notification.isDismissedMoment()) reason = notification.getDismissedReason();
          
          console.warn('Google OAuth prompt not completed. Reason:', reason);
          reject(new Error(`Google sign-in popup was ${reason}. Please click the Google Sign-In button above.`));
        }
      });
    } catch (err: any) {
      reject(new Error(err?.message || 'Google OAuth prompt failed.'));
    }
  });
}
