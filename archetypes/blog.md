---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
image: "/blog/{{ .File.ContentBaseName }}/cover.webp"
draft: false
author: "Ae"
tags: [""]
summary: ""
---