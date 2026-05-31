# Setup SSH Key for Safe Deployment (Windows PowerShell)

Write-Host "🔐 Setting up SSH key for AndaraLab deployment..." -ForegroundColor Cyan
Write-Host ""

$VPS_HOST = "177.7.55.182"
$VPS_USER = "root"
$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\id_rsa_andaralab"

# Check if key already exists
if (Test-Path $SSH_KEY_PATH) {
    Write-Host "✅ SSH key already exists: $SSH_KEY_PATH" -ForegroundColor Green
    Write-Host ""
    $use_existing = Read-Host "Do you want to use existing key? (y/n)"
    
    if ($use_existing -ne "y") {
        Write-Host "❌ Aborted. Please remove old key first: Remove-Item $SSH_KEY_PATH*" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "📝 Generating new SSH key..." -ForegroundColor Yellow
    
    # Create .ssh directory if not exists
    $sshDir = "$env:USERPROFILE\.ssh"
    if (-not (Test-Path $sshDir)) {
        New-Item -ItemType Directory -Path $sshDir | Out-Null
    }
    
    # Generate SSH key
    ssh-keygen -t rsa -b 4096 -f $SSH_KEY_PATH -N '""' -C "andaralab-deployment"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH key generated: $SSH_KEY_PATH" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to generate SSH key" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📤 Copying SSH key to VPS..." -ForegroundColor Cyan
Write-Host "   Host: $VPS_USER@$VPS_HOST"
Write-Host ""
Write-Host "⚠️  You will be asked for VPS password" -ForegroundColor Yellow
Write-Host ""

# Read public key
$publicKey = Get-Content "$SSH_KEY_PATH.pub"

# Copy key to VPS
$copyCommand = @"
mkdir -p ~/.ssh && \
echo '$publicKey' >> ~/.ssh/authorized_keys && \
chmod 600 ~/.ssh/authorized_keys && \
chmod 700 ~/.ssh && \
echo 'SSH key added successfully'
"@

ssh "$VPS_USER@$VPS_HOST" $copyCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SSH key copied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Testing SSH connection..." -ForegroundColor Cyan
    
    ssh -i $SSH_KEY_PATH -o BatchMode=yes -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo '✅ SSH connection works!'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Setup complete! You can now run:" -ForegroundColor Green
        Write-Host "   python safe_update_deployment.py" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠️  SSH key copied but connection test failed" -ForegroundColor Yellow
        Write-Host "   Try manually: ssh -i $SSH_KEY_PATH $VPS_USER@$VPS_HOST"
    }
} else {
    Write-Host ""
    Write-Host "❌ Failed to copy SSH key to VPS" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Manual setup:" -ForegroundColor Yellow
    Write-Host "1. Copy public key:"
    Write-Host "   Get-Content $SSH_KEY_PATH.pub | Set-Clipboard"
    Write-Host ""
    Write-Host "2. SSH to VPS (with password):"
    Write-Host "   ssh $VPS_USER@$VPS_HOST"
    Write-Host ""
    Write-Host "3. Add key to authorized_keys:"
    Write-Host "   mkdir -p ~/.ssh"
    Write-Host "   echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys"
    Write-Host "   chmod 600 ~/.ssh/authorized_keys"
    exit 1
}
