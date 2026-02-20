import argparse
import json
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Genera refresh token OAuth de Google para usar Drive con cuota de usuario."
    )
    parser.add_argument(
        "--client-secret-file",
        required=True,
        help="Ruta al JSON OAuth client secret descargado desde Google Cloud.",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8765,
        help="Puerto local para callback OAuth (default: 8765).",
    )
    args = parser.parse_args()

    secret_path = Path(args.client_secret_file)
    if not secret_path.exists():
        raise SystemExit(f"No existe el archivo: {secret_path}")

    data = json.loads(secret_path.read_text(encoding="utf-8"))
    if "installed" not in data and "web" not in data:
        raise SystemExit("El JSON no parece ser OAuth Client ID (Desktop/Web).")

    scopes = ["https://www.googleapis.com/auth/drive"]
    flow = InstalledAppFlow.from_client_secrets_file(str(secret_path), scopes=scopes)
    creds = flow.run_local_server(port=args.port, open_browser=True)

    print("\n=== OAuth listo ===")
    print(f"GOOGLE_OAUTH_CLIENT_ID={creds.client_id}")
    print(f"GOOGLE_OAUTH_CLIENT_SECRET={creds.client_secret}")
    print(f"GOOGLE_OAUTH_REFRESH_TOKEN={creds.refresh_token or ''}")
    print("GOOGLE_OAUTH_TOKEN_URI=https://oauth2.googleapis.com/token")

    if not creds.refresh_token:
        print(
            "\nATENCION: no se obtuvo refresh token.\n"
            "En Google OAuth Consent, habilita offline access y vuelve a autorizar."
        )


if __name__ == "__main__":
    main()
