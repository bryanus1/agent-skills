# CheatSheet de Comandos y Diagnóstico Remoto con `ssh-connect`

Guía rápida de recetas para inspección de servidores, contenedores y servicios mediante `ssh-connect --exec <alias>`.

---

## 1. Comandos del CLI `ssh-connect`

| Tarea | Comando |
| :--- | :--- |
| Listar servidores (humano) | `ssh-connect --list` |
| Listar servidores (agente JSON) | `ssh-connect --list --json` |
| Probar conectividad | `ssh-connect --test <alias>` |
| Ejecutar comando no interactivo | `ssh-connect --exec <alias> "<comando>"` |
| Ejecutar script por stdin | `ssh-connect --exec <alias> << 'EOF' ... EOF` |
| Subir archivo/directorio | `ssh-connect --upload <alias> <local> <remoto>` |
| Descargar archivo/directorio | `ssh-connect --download <alias> <remoto> <local>` |
| Abrir túnel SSH | `ssh-connect --tunnel <alias> 5432:localhost:5432` |
| Conexión ad-hoc rápida | `ssh-connect --quick user@ip -p 22 -i clave.pem` |
| Cerrar sesión multiplexada | `ssh-connect --disconnect <alias>` |

---

## 2. Recetas Rápidas de Diagnóstico

### Salud del Sistema (CPU, Memoria, Disco)
```bash
ssh-connect --exec <alias> << 'EOF'
echo "=== Tiempo activo y carga ==="
uptime
echo "=== Memoria RAM ==="
free -h 2>/dev/null || vm_stat
echo "=== Espacio en Disco ==="
df -h -x tmpfs -x devtmpfs
EOF
```

### Servicios Systemd
```bash
# Estado de un servicio
ssh-connect --exec <alias> "systemctl status nginx --no-pager"

# Ver últimas 50 líneas de log de un servicio
ssh-connect --exec <alias> "journalctl -u nginx -n 50 --no-pager"
```

### Contenedores Docker
```bash
# Contenedores en ejecución
ssh-connect --exec <alias> "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# Logs de un contenedor específico
ssh-connect --exec <alias> "docker logs --tail 100 <container-id>"

# Uso de recursos por contenedor
ssh-connect --exec <alias> "docker stats --no-stream"
```

---

## 3. Resolución de Problemas Comunes

### Permisos de Llave Privada (`UNPROTECTED PRIVATE KEY FILE`)
Si OpenSSH rechaza una llave `.pem` por permisos (`0644` o `0777`):
- `ssh-connect` detecta esto automáticamente y aplica `chmod 600` a la ruta indicada antes de conectar.

### Host Key Verification Failed
Si el servidor fue reinstalado y su fingerprint cambió:
- Ejecuta en la máquina local: `ssh-keygen -R <host_o_ip>` para renovar la entrada en `~/.ssh/known_hosts`.
