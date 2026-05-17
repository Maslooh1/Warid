# Community Templates

Each `.json` file here is a Warid template you can import via **Templates → Import**.

## Template format

```json
{
  "id": "unique-id",
  "name": "Display name",
  "icon": "Microphone",
  "color": "#2563EB",
  "prompt_body": "The full prompt sent to Gemini, alongside the audio.",
  "output_language": "en",
  "model": null,
  "is_default": 0
}
```

- `output_language` — `"en"`, `"ar"`, or `null` (let Gemini decide)
- `model` — a Gemini model ID, or `null` to use the user's default
- `icon` — any [Phosphor icon](https://phosphoricons.com/) name
- `is_default` — always `0` for community templates

## Contributing

Open a PR adding a new file here. Keep prompts focused on a single task. Test the template in Warid before submitting.
