"""
main.py — Entry point CLI untuk AI Business Agent V1.

Jalankan dengan: python main.py
Keluar dengan: ketik 'exit', 'quit', atau Ctrl+C
"""

import sys

import agent
import config
import tools


def print_banner():
    print("=" * 44)
    print("AI BUSINESS AGENT V1")
    print("=" * 44)
    print(f"Model    : {config.MODEL}")
    print("Provider : Ollama")
    print("Mode     : Local")
    print("=" * 44)
    print("Ketik 'exit' atau Ctrl+C untuk keluar.\n")


def main():
    print_banner()

    while True:
        try:
            user_input = input("User > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nSampai jumpa.")
            sys.exit(0)

        if not user_input:
            print("Agent > Input kosong, silakan ketik permintaan Anda.\n")
            continue

        if user_input.lower() in {"exit", "quit"}:
            print("Sampai jumpa.")
            sys.exit(0)

        print()
        try:
            answer = agent.run(user_input, log=lambda msg: print(msg))
            print(f"\nAgent >\n{answer}\n")

        except agent.AgentError as e:
            # Masalah komunikasi dengan LLM / format tool call
            print(f"\nAgent > Terjadi masalah: {e}\n")

        except tools.CalculatorError as e:
            print(f"\nAgent > Perhitungan tidak bisa dilakukan: {e}\n")

        except tools.SalesDataError as e:
            print(f"\nAgent > Data penjualan bermasalah: {e}\n")

        except Exception as e:
            # Jaring pengaman terakhir: jangan pernah tampilkan traceback
            # panjang ke user pada penggunaan normal.
            print(f"\nAgent > Terjadi kesalahan tak terduga: {e}\n")


if __name__ == "__main__":
    main()
