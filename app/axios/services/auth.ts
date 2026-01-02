import { BaseApiService } from '../base';

class AuthService extends BaseApiService {
  private refreshPromise: Promise<string> | null = null;
  private autoRefreshInterval: number | null = null;

  constructor() {
    super('/auth');
  }

  
}
