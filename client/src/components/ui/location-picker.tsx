import { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  value?: { latitude: string; longitude: string };
  onChange: (location: { latitude: string; longitude: string } | null) => void;
  label?: string;
  allowManualEdit?: boolean;
}

export default function LocationPicker({ 
  value, 
  onChange, 
  label = "Lokalizacja",
  allowManualEdit = true 
}: LocationPickerProps) {
  const [manualMode, setManualMode] = useState(false);
  const [manualLat, setManualLat] = useState(value?.latitude || '');
  const [manualLng, setManualLng] = useState(value?.longitude || '');
  const { toast } = useToast();

  const {
    coordinates,
    loading,
    error,
    permission,
    requestLocation,
    clearLocation
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000, // 5 minutes
  });

  // Update form when GPS coordinates change
  useEffect(() => {
    if (coordinates && !manualMode) {
      onChange({
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString(),
      });
    }
  }, [coordinates, manualMode, onChange]);

  // Update manual inputs when value changes externally
  useEffect(() => {
    if (value && !coordinates) {
      setManualLat(value.latitude);
      setManualLng(value.longitude);
    }
  }, [value, coordinates]);

  const handleGPSRequest = async () => {
    await requestLocation();
    if (error) {
      toast({
        title: "Błąd lokalizacji",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Lokalizacja pobrana",
        description: "Współrzędne GPS zostały automatycznie wypełnione.",
      });
    }
  };

  const handleManualUpdate = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Błędne współrzędne",
        description: "Wprowadź prawidłowe liczby dla szerokości i długości geograficznej.",
        variant: "destructive",
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Nieprawidłowe współrzędne",
        description: "Szerokość: -90 do 90, Długość: -180 do 180",
        variant: "destructive",
      });
      return;
    }

    onChange({
      latitude: lat.toString(),
      longitude: lng.toString(),
    });
    
    toast({
      title: "Współrzędne zaktualizowane",
      description: "Lokalizacja została zapisana ręcznie.",
    });
  };

  const handleClear = () => {
    clearLocation();
    setManualLat('');
    setManualLng('');
    onChange(null);
  };

  const getErrorMessage = (error: GeolocationPositionError) => {
    switch (error.code) {
      case 1:
        return "Dostęp do lokalizacji został odmówiony.";
      case 2:
        return "Lokalizacja niedostępna.";
      case 3:
        return "Przekroczono limit czasu pobierania lokalizacji.";
      default:
        return "Nieznany błąd podczas pobierania lokalizacji.";
    }
  };

  const getCurrentLocation = () => {
    if (coordinates) {
      return {
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString(),
      };
    }
    if (value?.latitude && value?.longitude) {
      return value;
    }
    return null;
  };

  const currentLocation = getCurrentLocation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {label}
          </span>
          
          {permission === 'granted' && coordinates && (
            <Badge variant="secondary" className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              GPS aktywny
            </Badge>
          )}
          
          {permission === 'denied' && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Brak uprawnień
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* GPS Section */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={coordinates ? "secondary" : "default"}
              size="sm"
              onClick={handleGPSRequest}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              {loading ? "Pobieranie..." : coordinates ? "Odśwież GPS" : "Pobierz GPS"}
            </Button>
            
            {allowManualEdit && (
              <Button
                type="button"
                variant={manualMode ? "default" : "outline"}
                size="sm"
                onClick={() => setManualMode(!manualMode)}
              >
                Ręcznie
              </Button>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {getErrorMessage(error)}
            </div>
          )}
        </div>

        {/* Manual Input Section */}
        {manualMode && allowManualEdit && (
          <div className="space-y-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="manual-lat" className="text-xs">
                  Szerokość geograficzna
                </Label>
                <Input
                  id="manual-lat"
                  type="number"
                  step="any"
                  placeholder="52.229676"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="manual-lng" className="text-xs">
                  Długość geograficzna
                </Label>
                <Input
                  id="manual-lng"
                  type="number"
                  step="any"
                  placeholder="21.012229"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleManualUpdate}
              className="w-full"
            >
              Zapisz współrzędne
            </Button>
          </div>
        )}

        {/* Current Location Display */}
        {currentLocation && (
          <div className="bg-green-50 p-3 rounded text-sm space-y-1">
            <div className="font-medium text-green-800">Aktualna lokalizacja:</div>
            <div className="text-green-700 font-mono text-xs">
              {parseFloat(currentLocation.latitude).toFixed(6)}, {parseFloat(currentLocation.longitude).toFixed(6)}
            </div>
            {coordinates?.accuracy && (
              <div className="text-green-600 text-xs">
                Dokładność: ±{Math.round(coordinates.accuracy)}m
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs h-6 px-2 text-red-600 hover:text-red-800"
            >
              Wyczyść lokalizację
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}