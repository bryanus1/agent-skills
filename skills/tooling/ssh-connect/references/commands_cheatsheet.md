# Remote Commands and Diagnostics Cheat Sheet for `ssh-connect`

Quick recipes for inspecting servers, containers and services through `ssh-connect --exec <alias>`.

---

## 1. `ssh-connect` CLI Commands

| Task | Command |
| :--- | :--- |
| List servers (human) | `ssh-connect --list` |
| List servers (agent, JSON) | `ssh-connect --list --json` |
| Test connectivity | `ssh-connect --test <alias>` |
| Run a non-interactive command | `ssh-connect --exec <alias> "<command>"` |
| Run a script through stdin | `ssh-connect --exec <alias> << 'EOF' ... EOF` |
| Upload a file/directory | `ssh-connect --upload <alias> <local> <remote>` |
| Download a file/directory | `ssh-connect --download <alias> <remote> <local>` |
| Open an SSH tunnel | `ssh-connect --tunnel <alias> 5432:localhost:5432` |
| Quick ad-hoc connection | `ssh-connect --quick user@ip -p 22 -i key.pem` |
| Close the multiplexed session | `ssh-connect --disconnect <alias>` |

---

## 2. Quick Diagnostic Recipes

### System Health (CPU, Memory, Disk)
```bash
ssh-connect --exec <alias> << 'EOF'
echo "=== Uptime and load ==="
uptime
echo "=== RAM ==="
free -h 2>/dev/null || vm_stat
echo "=== Disk space ==="
df -h -x tmpfs -x devtmpfs
EOF
```

### Systemd Services
```bash
# Status of a service
ssh-connect --exec <alias> "systemctl status nginx --no-pager"

# Last 50 log lines of a service
ssh-connect --exec <alias> "journalctl -u nginx -n 50 --no-pager"
```

### Docker Containers
```bash
# Running containers
ssh-connect --exec <alias> "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# Logs of a specific container
ssh-connect --exec <alias> "docker logs --tail 100 <container-id>"

# Resource usage per container
ssh-connect --exec <alias> "docker stats --no-stream"
```

---

## 3. Common Problems

### Private Key Permissions (`UNPROTECTED PRIVATE KEY FILE`)
If OpenSSH rejects a `.pem` key because of its permissions (`0644` or `0777`):
- `ssh-connect` detects it and runs `chmod 600` on that path before connecting.

### Host Key Verification Failed
If the server was reinstalled and its fingerprint changed:
- Run on the local machine: `ssh-keygen -R <host_or_ip>` to refresh the entry in `~/.ssh/known_hosts`.
