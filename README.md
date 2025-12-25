# SCHANS Project Architecture

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#e3f2fd','primaryTextColor':'#000','primaryBorderColor':'#90caf9','lineColor':'#64b5f6','secondaryColor':'#fff3e0','tertiaryColor':'#f1f8e9'}}}%%
mindmap
  root((SCHANS))
    Data
      shows.json
        Shinchan
        Doraemon
        Ninja Hattori
        Pink Panther
        Courage
      Episode Files
        shinchan.json
        Doraemon.json
        Ninja Hattori.json
        Pink Panther.json
        Courage The Cowardly Dog.json
    Components
      Header
        Logo
        Back Button
      Home View
        Hero Section
        Shows Grid
      Player View
        Video Container
          iframe Player
          Video Info
        Episodes List
    Flow
      Load Shows
      Select Show
      Load Episodes
      Play Episode
      Navigate
```