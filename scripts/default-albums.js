(function () {
  "use strict";

  globalThis.DEFAULT_ALBUMS = [
    {
      id: "cities",
      name: "cities",
      images: [
        {
          id: "cities-city-skyscrapers",
          src: "assets/cities/city-skyscrapers.jpg",
          label: "city-skyscrapers.jpg"
        },
        {
          id: "cities-dubai-skyline",
          src: "assets/cities/dubai-skyline.jpg",
          label: "dubai-skyline.jpg"
        },
        {
          id: "cities-hong-kong-harbor",
          src: "assets/cities/hong-kong-harbor.jpg",
          label: "hong-kong-harbor.jpg"
        },
        {
          id: "cities-london-skyline",
          src: "assets/cities/london-skyline.jpg",
          label: "london-skyline.jpg"
        },
        {
          id: "cities-new-york-skyline",
          src: "assets/cities/new-york-skyline.jpg",
          label: "new-york-skyline.jpg"
        },
        {
          id: "cities-paris-eiffel-tower",
          src: "assets/cities/paris-eiffel-tower.jpg",
          label: "paris-eiffel-tower.jpg"
        },
        {
          id: "cities-san-francisco-golden-gate",
          src: "assets/cities/san-francisco-golden-gate.jpg",
          label: "san-francisco-golden-gate.jpg"
        },
        {
          id: "cities-singapore-marina-bay",
          src: "assets/cities/singapore-marina-bay.jpg",
          label: "singapore-marina-bay.jpg"
        },
        {
          id: "cities-tokyo-city-night",
          src: "assets/cities/tokyo-city-night.jpg",
          label: "tokyo-city-night.jpg"
        },
        {
          id: "cities-venice-canal",
          src: "assets/cities/venice-canal.jpg",
          label: "venice-canal.jpg"
        }
      ]
    },
    {
      id: "kanye",
      name: "kanye",
      images: [
        {
          id: "kanye-wp5735473",
          src: "assets/kanye/wp5735473.jpg",
          label: "wp5735473.jpg"
        },
        {
          id: "kanye-wp5717645",
          src: "assets/kanye/wp5717645.png",
          label: "wp5717645.png"
        },
        {
          id: "kanye-wp5735568",
          src: "assets/kanye/wp5735568.jpg",
          label: "wp5735568.jpg"
        },
        {
          id: "kanye-wp5735587",
          src: "assets/kanye/wp5735587.jpg",
          label: "wp5735587.jpg"
        },
        {
          id: "kanye-wp5735609",
          src: "assets/kanye/wp5735609.jpg",
          label: "wp5735609.jpg"
        },
        {
          id: "kanye-wp5735772",
          src: "assets/kanye/wp5735772.jpg",
          label: "wp5735772.jpg"
        },
        {
          id: "kanye-wp9673902",
          src: "assets/kanye/wp9673902.jpg",
          label: "wp9673902.jpg"
        },
        {
          id: "kanye-wp14338884",
          src: "assets/kanye/wp14338884.jpg",
          label: "wp14338884.jpg"
        },
        {
          id: "kanye-wp11340994",
          src: "assets/kanye/wp11340994.jpg",
          label: "wp11340994.jpg"
        }
      ]
    },
    {
      id: "travis-scott",
      name: "travis scott",
      images: [
        {
          id: "travis-scott-wp5202843",
          src: "assets/travis-scott/wp5202843.jpg",
          label: "wp5202843.jpg"
        },
        {
          id: "travis-scott-wp5538795",
          src: "assets/travis-scott/wp5538795.jpg",
          label: "wp5538795.jpg"
        },
        {
          id: "travis-scott-wp5902811",
          src: "assets/travis-scott/wp5902811.jpg",
          label: "wp5902811.jpg"
        },
        {
          id: "travis-scott-wp5180585",
          src: "assets/travis-scott/wp5180585.jpg",
          label: "wp5180585.jpg"
        },
        {
          id: "travis-scott-wp5902853",
          src: "assets/travis-scott/wp5902853.jpg",
          label: "wp5902853.jpg"
        },
        {
          id: "travis-scott-wp5902861",
          src: "assets/travis-scott/wp5902861.png",
          label: "wp5902861.png"
        },
        {
          id: "travis-scott-wp5564039",
          src: "assets/travis-scott/wp5564039.jpg",
          label: "wp5564039.jpg"
        },
        {
          id: "travis-scott-wp1849377",
          src: "assets/travis-scott/wp1849377.jpg",
          label: "wp1849377.jpg"
        }
      ]
    },
    {
      id: "kpop",
      name: "kpop",
      images: [
        {
          id: "kpop-blackpink-pink-carpet-2024",
          src: "assets/kpop/blackpink-pink-carpet-2024.png",
          label: "blackpink-pink-carpet-2024.png"
        },
        {
          id: "kpop-blackpink-coachella-2023",
          src: "assets/kpop/blackpink-coachella-2023.jpg",
          label: "blackpink-coachella-2023.jpg"
        },
        {
          id: "kpop-twice-dickies-arena-2022",
          src: "assets/kpop/twice-dickies-arena-2022.jpg",
          label: "twice-dickies-arena-2022.jpg"
        },
        {
          id: "kpop-newjeans-melon-music-awards-2023",
          src: "assets/kpop/newjeans-melon-music-awards-2023.jpg",
          label: "newjeans-melon-music-awards-2023.jpg"
        },
        {
          id: "kpop-le-sserafim-golden-disc-2026",
          src: "assets/kpop/le-sserafim-golden-disc-2026.png",
          label: "le-sserafim-golden-disc-2026.png"
        },
        {
          id: "kpop-wp3111579",
          src: "https://wallpapercave.com/wp/wp3111579.jpg",
          label: "wp3111579.jpg"
        },
        {
          id: "kpop-wp3544114",
          src: "https://wallpapercave.com/wp/wp3544114.jpg",
          label: "wp3544114.jpg"
        },
        {
          id: "kpop-wp13858884",
          src: "https://wallpapercave.com/wp/wp13858884.jpg",
          label: "wp13858884.jpg"
        },
        {
          id: "kpop-wp11688510",
          src: "https://wallpapercave.com/wp/wp11688510.jpg",
          label: "wp11688510.jpg"
        }
      ]
    },
    {
      id: "planet",
      name: "planet",
      images: [
        {
          id: "planet-wp5148923",
          src: "assets/planet/wp5148923.jpg",
          label: "wp5148923.jpg"
        },
        {
          id: "planet-wp9035635",
          src: "assets/planet/wp9035635.jpg",
          label: "wp9035635.jpg"
        },
        {
          id: "planet-wp9035636",
          src: "assets/planet/wp9035636.jpg",
          label: "wp9035636.jpg"
        },
        {
          id: "planet-wp6470876",
          src: "assets/planet/wp6470876.jpg",
          label: "wp6470876.jpg"
        },
        {
          id: "planet-wp9035649",
          src: "assets/planet/wp9035649.jpg",
          label: "wp9035649.jpg"
        },
        {
          id: "planet-wp9035668",
          src: "assets/planet/wp9035668.jpg",
          label: "wp9035668.jpg"
        }
      ]
    },
    {
      id: "mountains",
      name: "mountains",
      images: [
        {
          id: "mountains-himalayas-aerial",
          src: "assets/mountains/himalayas-aerial.jpg",
          label: "himalayas-aerial.jpg"
        },
        {
          id: "mountains-fitz-roy-road",
          src: "assets/mountains/fitz-roy-road.jpg",
          label: "fitz-roy-road.jpg"
        },
        {
          id: "mountains-snowy-sunrise-peak",
          src: "assets/mountains/snowy-sunrise-peak.png",
          label: "snowy-sunrise-peak.png"
        },
        {
          id: "mountains-alpine-lake-reflection",
          src: "assets/mountains/alpine-lake-reflection.png",
          label: "alpine-lake-reflection.png"
        },
        {
          id: "mountains-desert-mountain-storm",
          src: "assets/mountains/desert-mountain-storm.png",
          label: "desert-mountain-storm.png"
        }
      ]
    },
    {
      id: "dogs",
      name: "dogs",
      images: [
        {
          id: "dogs-corgi-portrait",
          src: "assets/dogs/corgi-portrait.jpg",
          label: "corgi-portrait.jpg"
        },
        {
          id: "dogs-dog-close-portrait",
          src: "assets/dogs/dog-close-portrait.jpg",
          label: "dog-close-portrait.jpg"
        },
        {
          id: "dogs-dog-field-bokeh",
          src: "assets/dogs/dog-field-bokeh.jpg",
          label: "dog-field-bokeh.jpg"
        },
        {
          id: "dogs-dog-forest-path",
          src: "assets/dogs/dog-forest-path.jpg",
          label: "dog-forest-path.jpg"
        },
        {
          id: "dogs-dog-portrait-tongue",
          src: "assets/dogs/dog-portrait-tongue.jpg",
          label: "dog-portrait-tongue.jpg"
        },
        {
          id: "dogs-dog-puppy-blanket",
          src: "assets/dogs/dog-puppy-blanket.jpg",
          label: "dog-puppy-blanket.jpg"
        },
        {
          id: "dogs-dog-road-trip",
          src: "assets/dogs/dog-road-trip.jpg",
          label: "dog-road-trip.jpg"
        },
        {
          id: "dogs-dogs-on-grass",
          src: "assets/dogs/dogs-on-grass.jpg",
          label: "dogs-on-grass.jpg"
        },
        {
          id: "dogs-golden-retriever-grass",
          src: "assets/dogs/golden-retriever-grass.jpg",
          label: "golden-retriever-grass.jpg"
        },
        {
          id: "dogs-happy-dog-field",
          src: "assets/dogs/happy-dog-field.jpg",
          label: "happy-dog-field.jpg"
        }
      ]
    }
  ];
})();
