export interface VehicleValuation {
  id: number
  asset_id: number | null
  purchase_id: number | null
  our_price: number | null
  market_price: number | null
  market_min: number | null
  market_max: number | null
  market_avg: number | null
  market_median: number | null
  market_std_dev: number | null
  market_count: number
  price_vs_market: number | null   // negative = below market = good
  negotiation_price: number | null
  negotiation_advice: string | null
  investment_score: number | null
  liquidity_score: number | null
  roi_1y: number | null
  risk_score: number | null
  value_6m: number | null
  value_12m: number | null
  value_24m: number | null
  ai_recommendation: string | null
  ai_analysis: string | null
  research_id: number | null
  created_at: string
  updated_at: string
}

export interface QuickValuationInput {
  category: string
  brand?: string
  model?: string
  year?: number
  km?: number
  price: number
  vehicleAge?: number
}

export interface ValuationOpportunity extends VehicleValuation {
  name: string
  brand: string | null
  model: string | null
  year: number | null
  asset_id: number | null
}

export interface DashboardOpportunities {
  opportunities: ValuationOpportunity[]
  cheapest: ValuationOpportunity[]
  stats: {
    total: number
    avg_score: number | null
    avg_roi: number | null
    avg_liquidity: number | null
  }
}
