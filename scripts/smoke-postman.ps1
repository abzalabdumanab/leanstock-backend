$ErrorActionPreference = "Stop"

$base = if ($env:BASE_URL) { $env:BASE_URL } else { "http://127.0.0.1:3000/api/v1" }
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

function Step-Log($name) {
  Write-Host "[OK] $name"
}

function Invoke-Json($method, $url, $body = $null, $headers = @{}) {
  $params = @{
    Method = $method
    Uri = $url
    Headers = $headers
    TimeoutSec = 15
  }

  if ($null -ne $body) {
    $params.ContentType = "application/json"
    $params.Body = ($body | ConvertTo-Json -Depth 10)
  }

  Invoke-RestMethod @params
}

$register = Invoke-Json Post "$base/auth/register" @{
  tenantName = "Postman Smoke $stamp"
  email = "postman$stamp@arzan.kz"
  password = "SecurePass99!!!"
  role = "TENANT_ADMIN"
}
Step-Log "register"

$authHeaders = @{ Authorization = "Bearer $($register.tokens.accessToken)" }

Invoke-Json Get "$base/products?limit=20" $null $authHeaders | Out-Null
Step-Log "products list"

$product = Invoke-Json Post "$base/products" @{
  name = "Postman Sneakers $stamp"
  description = "Leather city sneakers"
  category = "Footwear"
  baseUnit = "pcs"
  variants = @(@{
    sku = "SHOE-PM-$stamp"
    size = "42"
    color = "Black"
    costPrice = 2500
    retailPrice = 5990
    liquidationPrice = 1500
    reorderPoint = 10
  })
} $authHeaders
Step-Log "product create"

$sourceWarehouse = Invoke-Json Post "$base/warehouses" @{
  name = "Main Warehouse $stamp"
  address = "Almaty, Zhandosov 55"
} $authHeaders
Step-Log "source warehouse create"

$destinationWarehouse = Invoke-Json Post "$base/warehouses" @{
  name = "Second Warehouse $stamp"
  address = "Astana, Mangilik El 1"
} $authHeaders
Step-Log "destination warehouse create"

Invoke-Json Post "$base/stock" @{
  variantId = $product.variants[0].id
  warehouseId = $sourceWarehouse.id
  quantity = 20
} $authHeaders | Out-Null
Step-Log "stock upsert"

$transfer = Invoke-Json Post "$base/transfers" @{
  sourceId = $sourceWarehouse.id
  destinationId = $destinationWarehouse.id
  note = "Postman smoke transfer"
  items = @(@{
    variantId = $product.variants[0].id
    quantity = 5
  })
} $authHeaders
Step-Log "transfer create"

Invoke-Json Post "$base/transfers/$($transfer.id)/confirm" $null $authHeaders | Out-Null
Step-Log "transfer confirm"

$refresh = Invoke-Json Post "$base/auth/refresh" @{
  refreshToken = $register.tokens.refreshToken
}
Step-Log "refresh"

$logout = Invoke-Json Post "$base/auth/logout" @{
  refreshToken = $refresh.refreshToken
}
Step-Log "logout: $($logout.message)"

Write-Host "Smoke flow completed successfully."
