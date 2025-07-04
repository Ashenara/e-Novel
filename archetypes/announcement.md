---
announcement: true
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
image: "/blog/{{ .File.ContentBaseName }}/cover.webp"
draft: false
author: "Admin"
summary: ""
---