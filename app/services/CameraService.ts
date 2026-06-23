import * as FileSystem from 'expo-file-system/legacy';
import { Camera, CameraView, CameraType } from 'expo-camera';

export class CameraService {
  private static cameraRef: any = null;

  static async requestPermissions() {
    try {
      const result = await Camera.requestCameraPermissionsAsync();
      return result.status === 'granted';
    } catch { return false; }
  }

  static async capturePhoto(): Promise<string> {
    if (!this.cameraRef) {
      // Graceful failure for simulator without CameraView mounted
      throw new Error('Camera not available: CameraView not mounted. Camera capture requires a physical device or a CameraView component in the app.');
    }

    try {
      const photo = await this.cameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // Save to permanent storage
      const filename = `photo-${Date.now()}.jpg`;
      if (!FileSystem.documentDirectory) {
        throw new Error('Document directory is not available on this device.');
      }
      const path = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: photo.uri,
        to: path,
      });

      return path;
    } catch (error) {
      throw new Error(`Failed to capture photo: ${error}`);
    }
  }

  static async getVideoStream() {
    if (!this.cameraRef) {
      throw new Error('Camera not initialized');
    }

    // Return stream metadata for processing
    return {
      type: 'video',
      format: 'h264',
      dimensions: { width: 1920, height: 1440 },
    };
  }

  static setCameraRef(ref: any) {
    this.cameraRef = ref;
  }

  static async getBase64Photo(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      throw new Error(`Failed to read photo: ${error}`);
    }
  }
}
