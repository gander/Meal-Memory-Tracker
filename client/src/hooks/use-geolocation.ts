import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  permission: 'granted' | 'denied' | 'prompt';
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
    permission: 'prompt',
  });

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: {
          code: 2,
          message: 'Geolocation not supported',
        } as GeolocationPositionError,
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check permission first
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ ...prev, permission: permission.state as any }));
        
        if (permission.state === 'denied') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: {
              code: 1,
              message: 'Permission denied',
            } as GeolocationPositionError,
          }));
          return;
        }
      }

      const onSuccess = (position: GeolocationPosition) => {
        setState(prev => ({
          ...prev,
          position,
          loading: false,
          error: null,
          permission: 'granted',
        }));
      };

      const onError = (error: GeolocationPositionError) => {
        setState(prev => ({
          ...prev,
          error,
          loading: false,
          permission: error.code === 1 ? 'denied' : prev.permission,
        }));
      };

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      };

      if (options.watchPosition) {
        const watchId = navigator.geolocation.watchPosition(
          onSuccess,
          onError,
          defaultOptions
        );
        return () => navigator.geolocation.clearWatch(watchId);
      } else {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onError,
          defaultOptions
        );
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: {
          code: 2,
          message: 'Unknown error',
        } as GeolocationPositionError,
      }));
    }
  }, [options]);

  const clearLocation = useCallback(() => {
    setState({
      position: null,
      error: null,
      loading: false,
      permission: 'prompt',
    });
  }, []);

  return {
    ...state,
    requestLocation,
    clearLocation,
    coordinates: state.position ? {
      latitude: state.position.coords.latitude,
      longitude: state.position.coords.longitude,
      accuracy: state.position.coords.accuracy,
    } : null,
  };
}