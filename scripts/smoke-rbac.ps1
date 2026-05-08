$ErrorActionPreference = "Stop"

$base = if ($env:BASE_URL) { $env:BASE_URL } else { "http://127.0.0.1:3000/api/v1" }
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

function Write-Ok($name) {
  Write-Host "[OK] $name"
}

function Invoke-Api($method, $path, $body = $null, $token = $null, $expectedStatus = 200) {
  $headers = @{}
  if ($token) {
    $headers.Authorization = "Bearer $token"
  }

  $params = @{
    Method = $method
    Uri = "$base$path"
    TimeoutSec = 15
    UseBasicParsing = $true
  }

  if ($headers.Count -gt 0) {
    $params.Headers = $headers
  }

  if ($null -ne $body) {
    $params.ContentType = "application/json"
    $params.Body = ($body | ConvertTo-Json -Depth 10)
  }

  try {
    $response = Invoke-WebRequest @params
    $status = [int]$response.StatusCode
    $content = $response.Content
  } catch {
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $content = $reader.ReadToEnd()
    } else {
      throw
    }
  }

  if ($status -ne $expectedStatus) {
    throw "Expected $expectedStatus for $method $path, got $status. Response: $content"
  }

  if ([string]::IsNullOrWhiteSpace($content)) {
    return $null
  }

  return $content | ConvertFrom-Json
}

function Login($email) {
  $result = Invoke-Api Post "/auth/login" @{
    email = $email
    password = "Password123!"
  }
  return $result.tokens.accessToken
}

node scripts/clear-active-sessions.js super@arzan.kz admin@arzan.kz manager@arzan.kz analyst@arzan.kz

$superToken = Login "super@arzan.kz"
$adminToken = Login "admin@arzan.kz"
$managerToken = Login "manager@arzan.kz"
$analystToken = Login "analyst@arzan.kz"
Write-Ok "all seeded users can login"

$superProduct = Invoke-Api Post "/products" @{
  name = "Super Product $stamp"
  description = "RBAC smoke product"
  category = "Smoke"
  baseUnit = "pcs"
  variants = @(@{
    sku = "SUPER-RBAC-$stamp"
    size = "42"
    color = "Black"
    costPrice = 1000
    retailPrice = 2000
    liquidationPrice = 700
    reorderPoint = 5
  })
} $superToken 201
Write-Ok "SUPER_ADMIN can create products"

Invoke-Api Post "/warehouses" @{
  name = "Super Warehouse $stamp"
  address = "Almaty"
} $superToken 201 | Out-Null
Write-Ok "SUPER_ADMIN can create warehouses"

Invoke-Api Post "/products" @{
  name = "Admin Product $stamp"
  description = "RBAC smoke product"
  category = "Smoke"
  baseUnit = "pcs"
  variants = @(@{
    sku = "ADMIN-RBAC-$stamp"
    size = "41"
    color = "White"
    costPrice = 900
    retailPrice = 1900
    liquidationPrice = 600
    reorderPoint = 5
  })
} $adminToken 201 | Out-Null
Write-Ok "TENANT_ADMIN can create products"

Invoke-Api Post "/warehouses" @{
  name = "Admin Warehouse $stamp"
  address = "Astana"
} $adminToken 201 | Out-Null
Write-Ok "TENANT_ADMIN can create warehouses"

Invoke-Api Post "/warehouses" @{
  name = "Manager Warehouse $stamp"
  address = "Shymkent"
} $managerToken 201 | Out-Null
Write-Ok "WAREHOUSE_MANAGER can create warehouses"

Invoke-Api Post "/products" @{
  name = "Forbidden Manager Product $stamp"
  description = "Should fail"
  category = "Smoke"
  baseUnit = "pcs"
  variants = @(@{
    sku = "MANAGER-FORBIDDEN-$stamp"
    costPrice = 100
    retailPrice = 200
    liquidationPrice = 50
    reorderPoint = 1
  })
} $managerToken 403 | Out-Null
Write-Ok "WAREHOUSE_MANAGER cannot create products"

$products = Invoke-Api Get "/products?limit=20" $null $managerToken
$variantId = $products.data[0].variants[0].id
$warehouses = Invoke-Api Get "/warehouses" $null $managerToken
$sourceId = $warehouses.data[0].id
$destinationId = $warehouses.data[1].id

Invoke-Api Post "/stock" @{
  variantId = $variantId
  warehouseId = $sourceId
  quantity = 50
} $managerToken 201 | Out-Null
Write-Ok "WAREHOUSE_MANAGER can update stock"

$transfer = Invoke-Api Post "/transfers" @{
  sourceId = $sourceId
  destinationId = $destinationId
  note = "RBAC smoke transfer"
  items = @(@{
    variantId = $variantId
    quantity = 1
  })
} $managerToken 201
Write-Ok "WAREHOUSE_MANAGER can create transfers"

Invoke-Api Post "/transfers/$($transfer.id)/confirm" $null $managerToken 200 | Out-Null
Write-Ok "WAREHOUSE_MANAGER can confirm transfers"

Invoke-Api Get "/products?limit=20" $null $analystToken 200 | Out-Null
Invoke-Api Get "/warehouses" $null $analystToken 200 | Out-Null
Invoke-Api Get "/stock" $null $analystToken 200 | Out-Null
Invoke-Api Get "/transfers" $null $analystToken 200 | Out-Null
Write-Ok "ANALYST can read products, warehouses, stock, and transfers"

Invoke-Api Post "/warehouses" @{
  name = "Forbidden Analyst Warehouse $stamp"
  address = "Kokshetau"
} $analystToken 403 | Out-Null
Write-Ok "ANALYST cannot write warehouses"

Write-Host "RBAC smoke flow completed successfully."
