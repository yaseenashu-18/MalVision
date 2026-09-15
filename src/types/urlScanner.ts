/**
 * MALVISION — Standardized URL Scanner Schema & Types
 * Extensible Architecture for Unified Scan Reports
 */

export type URLScanVerdict =
  | 'safe'
  | 'low_risk'
  | 'suspicious'
  | 'malicious'
  | 'phishing'
  | 'scam'
  | 'unknown'
  | 'inconclusive';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export type ResultStatus =
  | 'detected'
  | 'not_detected'
  | 'suspicious'
  | 'unknown'
  | 'unavailable'
  | 'error'
  | 'not_applicable';

export type ScanStageStatus =
  | 'validating'
  | 'resolving'
  | 'reputation'
  | 'redirects'
  | 'inspecting'
  | 'security'
  | 'building'
  | 'completed'
  | 'partially_completed'
  | 'failed';

export interface URLScanSource {
  type: 'standard_engine' | 'dns' | 'ssl' | 'http' | 'reputation' | 'blacklist' | 'third_party' | 'unavailable';
  name: string;
  version: string;
}

export interface URLScanEvidenceItem {
  id: string;
  finding: string;
  severity: RiskLevel;
  confidence: number;
  evidence: string[];
  source: URLScanSource;
  checkedAt: string;
}

export interface SecurityEngineResultItem {
  engineName: string;
  engineVersion: string;
  status: ResultStatus;
  category: string;
  rawResult?: string;
  normalizedResult: string;
  checkedAt: string;
}

export interface BlacklistProviderResult {
  provider: string;
  status: ResultStatus;
  category: string;
  details: string;
  checkedAt: string;
}

export interface ThreatCheckItem {
  key: string;
  name: string;
  status: ResultStatus;
  severity: RiskLevel;
  confidence: number;
  description: string;
  evidence: string[];
  source: URLScanSource;
  checkedAt: string;
}

export interface RedirectHop {
  step: number;
  url: string;
  statusCode: number;
  type: 'http' | 'javascript' | 'meta_refresh' | 'cross_domain';
  domain: string;
}

export interface CookieItem {
  name: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'Strict' | 'Lax' | 'None' | 'Unspecified';
  expiration?: string;
}

export interface HistoricalScanItem {
  scanId: string;
  url: string;
  domain: string;
  timestamp: string;
  verdict: URLScanVerdict;
  riskScore: number;
  scannerVersion: string;
}

export interface StandardURLScanResult {
  scan_id: string;
  url: string;
  normalized_url: string;
  final_url: string;
  scan_status: 'completed' | 'partially_completed' | 'failed';
  overall_verdict: URLScanVerdict;
  risk_level: RiskLevel;
  risk_score: number; // 0 to 100
  confidence: number; // 0.0 to 1.0
  scan_started_at: string;
  scan_completed_at: string;
  scan_duration: string;
  scanner_version: string;
  data_sources: string[];
  isDemoData?: boolean;
  verdict_reasons: string[];
  positive_indicators: string[];
  negative_indicators: string[];
  sections: {
    verdict_summary: {
      checks_passed: number;
      checks_detected: number;
      checks_unavailable: number;
      summary_text: string;
    };
    threat_detection: {
      status: ResultStatus;
      items: ThreatCheckItem[];
    };
    security_engines: {
      total: number;
      detected: number;
      clean: number;
      suspicious: number;
      unavailable: number;
      engines: SecurityEngineResultItem[];
    };
    blacklists: {
      total_checked: number;
      clean: number;
      detected: number;
      unavailable: number;
      providers: BlacklistProviderResult[];
    };
    phishing_analysis: {
      phishing_status: ResultStatus;
      phishing_confidence: number;
      phishing_indicators: string[];
      target_brand: string | null;
      impersonated_domain: string | null;
      login_form_detected: boolean;
      credential_collection_possible: boolean;
      visual_similarity: string | null;
      suspicious_language: boolean;
      social_engineering_indicators: string[];
    };
    brand_impersonation: {
      brand_detected: boolean;
      claimed_brand: string | null;
      actual_domain: string;
      expected_domain: string | null;
      similarity_score: number;
      impersonation_status: ResultStatus;
      evidence: string[];
    };
    url_analysis: {
      length: number;
      scheme: string;
      host: string;
      port: number | null;
      path: string;
      query_params_count: number;
      fragment: string | null;
      is_https: boolean;
      is_ip_based: boolean;
      is_punycode: boolean;
      subdomain_count: number;
      suspicious_keywords: string[];
      is_url_shortener: boolean;
      suspicious_encoding: boolean;
      embedded_credentials: boolean;
    };
    redirect_analysis: {
      redirect_count: number;
      redirect_chain: RedirectHop[];
      cross_domain_redirects: boolean;
      redirect_loop: boolean;
      final_url: string;
      suspicious_redirect: boolean;
    };
    website_preview: {
      available: boolean;
      page_title: string | null;
      meta_description: string | null;
      language: string | null;
      dimensions: string | null;
      render_timestamp: string | null;
    };
    website_content: {
      html_size_bytes: number;
      total_links: number;
      forms_count: number;
      images_count: number;
      iframes_count: number;
      scripts_count: number;
      stylesheets_count: number;
    };
    login_credential_analysis: {
      login_form_detected: boolean;
      username_field_detected: boolean;
      password_field_detected: boolean;
      otp_field_detected: boolean;
      email_field_detected: boolean;
      payment_field_detected: boolean;
      auth_endpoints_count: number;
    };
    payment_analysis: {
      credit_card_fields: boolean;
      debit_card_fields: boolean;
      upi_fields: boolean;
      banking_info_fields: boolean;
      crypto_wallet_fields: boolean;
      payment_forms_detected: boolean;
    };
    javascript_analysis: {
      script_count: number;
      external_script_count: number;
      inline_script_count: number;
      obfuscated_script_count: number;
      suspicious_script_count: number;
      malicious_script_count: number;
    };
    cookies_analysis: {
      cookie_count: number;
      first_party_cookies: number;
      third_party_cookies: number;
      secure_cookies: number;
      http_only_cookies: number;
      cookies_list: CookieItem[];
    };
    network_activity: {
      request_count: number;
      response_count: number;
      unique_domains: number;
      unique_ips: number;
      external_domains: number;
      third_party_requests: number;
      failed_requests: number;
      suspicious_requests: number;
    };
    domain_information: {
      domain: string;
      registrable_domain: string;
      subdomain: string;
      tld: string;
      domain_age: string | null;
      creation_date: string | null;
      updated_date: string | null;
      expiration_date: string | null;
      registrar: string | null;
      whois_privacy: boolean | null;
      registration_status: string | null;
    };
    domain_reputation: {
      reputation_status: ResultStatus;
      reputation_score: number | null;
      reputation_sources: string[];
      historical_threats: string[];
      community_reports_count: number;
      first_seen: string | null;
      last_seen: string | null;
    };
    ip_infrastructure: {
      ipv4: string | null;
      ipv6: string | null;
      asn: string | null;
      isp: string | null;
      hosting_provider: string | null;
      server_header: string | null;
      country: string | null;
      country_code: string | null;
      region: string | null;
      city: string | null;
      organization: string | null;
    };
    dns_analysis: {
      a_records: string[];
      aaaa_records: string[];
      cname_records: string[];
      mx_records: string[];
      ns_records: string[];
      txt_records: string[];
      dnssec: 'Enabled' | 'Disabled' | 'Unknown';
    };
    ssl_tls: {
      https_enabled: boolean;
      valid: boolean | null;
      issuer: string | null;
      subject: string | null;
      san: string[];
      valid_from: string | null;
      valid_until: string | null;
      days_to_expiration: number | null;
      hostname_match: boolean | null;
      tls_version: string | null;
      note: string;
    };
    http_analysis: {
      status_code: number;
      content_type: string | null;
      content_length: number | null;
      server: string | null;
      response_time_ms: number;
      security_headers: {
        csp: boolean;
        hsts: boolean;
        x_frame_options: boolean;
        x_content_type_options: boolean;
        referrer_policy: boolean;
        permissions_policy: boolean;
        detected_count: number;
        total_recommended: number;
      };
    };
    download_analysis: {
      download_detected: boolean;
      filename: string | null;
      content_type: string | null;
      size_formatted: string | null;
      sha256: string | null;
      md5: string | null;
      file_scan_status: string;
    };
    technology_detection: {
      cms: string | null;
      frameworks: string[];
      js_frameworks: string[];
      server: string | null;
      cdn: string | null;
      analytics: string[];
      advertising: string[];
      technologies_list: string[];
    };
    security_configuration: {
      https_enforcement: ResultStatus;
      security_headers_quality: ResultStatus;
      cookie_security: ResultStatus;
      cors_config: ResultStatus;
      clickjacking_protection: ResultStatus;
      mime_sniffing_protection: ResultStatus;
    };
    historical_scans: {
      available: boolean;
      history: HistoricalScanItem[];
    };
    ai_security_summary: {
      summary_text: string;
      recommendation_verdict: string;
      traceable_evidence: string[];
    };
  };
  errors: string[];
  warnings: string[];
}

/**
 * Standard Plugin Module Interface for Future Specialized Models
 */
export interface URLScanModuleContext {
  url: string;
  normalizedUrl: string;
  startTime: number;
  options?: any;
}

export interface URLScanModule<T = any> {
  id: string;
  name: string;
  version: string;
  initialize(): Promise<void>;
  analyze(context: URLScanModuleContext): Promise<T>;
}
