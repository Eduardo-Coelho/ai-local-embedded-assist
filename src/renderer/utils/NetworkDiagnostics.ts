export interface NetworkStatus {
  internetConnection: boolean;
  huggingFaceAccessible: boolean;
  corsSupported: boolean;
  details: string[];
}

export class NetworkDiagnostics {
  static async checkNetworkStatus(): Promise<NetworkStatus> {
    const details: string[] = [];
    let internetConnection = false;
    let huggingFaceAccessible = false;
    let corsSupported = false;

    try {
      // Test basic internet connectivity
      console.log('🔍 Testing internet connectivity...');
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        internetConnection = true;
        details.push('✅ Basic internet connectivity: OK');
      } else {
        details.push('❌ Basic internet connectivity: Failed');
      }
    } catch (error) {
      details.push(`❌ Basic internet connectivity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test Hugging Face Hub accessibility
      console.log('🔍 Testing Hugging Face Hub accessibility...');
      const hfResponse = await fetch('https://huggingface.co/api/models/deepseek-ai/deepseek-coder-1.3b-base', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (hfResponse.ok) {
        huggingFaceAccessible = true;
        details.push('✅ Hugging Face Hub: Accessible');
      } else {
        details.push(`❌ Hugging Face Hub: HTTP ${hfResponse.status} - ${hfResponse.statusText}`);
      }
    } catch (error) {
      details.push(`❌ Hugging Face Hub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test CORS support
      console.log('🔍 Testing CORS support...');
      const corsResponse = await fetch('https://huggingface.co/api/models', {
        method: 'OPTIONS',
        mode: 'cors',
      });

      if (corsResponse.ok || corsResponse.status === 0) {
        corsSupported = true;
        details.push('✅ CORS support: Available');
      } else {
        details.push(`❌ CORS support: HTTP ${corsResponse.status}`);
      }
    } catch (error) {
      details.push(`❌ CORS support: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      internetConnection,
      huggingFaceAccessible,
      corsSupported,
      details
    };
  }

  static async getRecommendations(status: NetworkStatus): Promise<string[]> {
    const recommendations: string[] = [];

    if (!status.internetConnection) {
      recommendations.push('🌐 Check your internet connection');
      recommendations.push('🔌 Try disconnecting and reconnecting to your network');
      recommendations.push('📱 Try using a different network (mobile hotspot)');
    }

    if (!status.huggingFaceAccessible) {
      recommendations.push('🛡️ Check if your firewall is blocking Hugging Face');
      recommendations.push('🔒 Try disabling antivirus temporarily');
      recommendations.push('🌍 Hugging Face might be temporarily unavailable');
    }

    if (!status.corsSupported) {
      recommendations.push('🔧 CORS issues detected - try using a different browser');
      recommendations.push('⚙️ Check browser security settings');
    }

    if (status.internetConnection && !status.huggingFaceAccessible) {
      recommendations.push('📡 Try using a VPN to bypass network restrictions');
      recommendations.push('⏰ Wait a few minutes and try again');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Network appears to be working correctly');
      recommendations.push('🔄 Try restarting the application');
    }

    return recommendations;
  }

  static logNetworkStatus(status: NetworkStatus): void {
    console.log('🌐 Network Diagnostics Results:');
    console.log('================================');
    status.details.forEach(detail => console.log(detail));
    console.log('================================');
  }
} 