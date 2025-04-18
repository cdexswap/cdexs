import { NextResponse } from 'next/server';
import requestIp from 'request-ip';

interface RequestWithHeaders {
  headers: {
    [key: string]: string | string[] | undefined;
  };
}

export async function GET(request: Request) {
  try {
    const headers = Object.fromEntries(request.headers.entries());
    const ip = requestIp.getClientIp({ headers } as RequestWithHeaders) || '127.0.0.1';
    console.log('[Location Debug] Headers:', headers);
    console.log('[Location Debug] Detected IP:', ip);
    
    // Call IP geolocation service
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    console.log('[Location Debug] IP Geolocation Response:', data);
    
    // Map country code to currency
    const countryCurrencyMap: Record<string, string> = {
      US: 'USD',
      TH: 'THB',
      SG: 'SGD',
      // EU countries will return EUR
      DE: 'EUR',
      FR: 'EUR',
      IT: 'EUR',
      ES: 'EUR',
      LA: 'LAK',
      MY: 'MYR',
      VN: 'VND',
      CN: 'CNY'
    };
    
    const currency = countryCurrencyMap[data.country_code] || '';
    
    console.log('[Location Debug] Final Output:', { currency, country_code: data.country_code });
    
    return NextResponse.json({ 
      currency,
      country_code: data.country_code 
    });
  } catch (error) {
    console.error('Error getting location:', error);
    return NextResponse.json({ currency: '' }, { status: 500 });
  }
}
