import { ApiResponse } from '../types';

const API_BASE = '/api';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await res.json();
      return json;
    } else {
      // Non-JSON response (e.g., HTML error from proxy/server)
      return {
        success: false,
        error: 'Maaf, layanan sedang mengalami kendala. Silakan coba kembali beberapa saat lagi.',
      };
    }
  } catch (err: any) {
    console.error('API request error:', err);
    return {
      success: false,
      error: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
    };
  }
}

// Download Excel File Helper
export async function downloadExcelFile(endpointPath: string = '/admin/aspirations/export'): Promise<boolean> {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}${endpointPath}`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!res.ok) {
      console.error('Excel export HTTP status:', res.status);
      throw new Error('Gagal mengunduh berkas dari server');
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const jsonErr = await res.json();
      console.error('Server returned error JSON instead of Excel file:', jsonErr);
      return false;
    }

    const arrayBuffer = await res.arrayBuffer();
    const excelBlob = new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(excelBlob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `aspirasi-internal-sdit-nurul-kautsar-${today}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 100);

    return true;
  } catch (err) {
    console.error('Excel download failed:', err);
    return false;
  }
}
