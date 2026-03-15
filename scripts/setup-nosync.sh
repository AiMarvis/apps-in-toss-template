#!/bin/bash
# Google Drive에서 node_modules 동기화 방지
# 심볼릭 링크를 사용하여 .nosync 디렉토리로 우회

DIRS=("node_modules" "dist" ".vite")

for DIR in "${DIRS[@]}"; do
  NOSYNC="${DIR}.nosync"

  if [ -d "$DIR" ] && [ ! -L "$DIR" ]; then
    mv "$DIR" "$NOSYNC"
    ln -s "$NOSYNC" "$DIR"
    echo "✅ $DIR → $NOSYNC (심볼릭 링크 생성)"
  elif [ ! -d "$NOSYNC" ] && [ ! -L "$DIR" ]; then
    mkdir -p "$NOSYNC"
    ln -s "$NOSYNC" "$DIR"
    echo "📁 $NOSYNC 생성 + $DIR 심볼릭 링크"
  else
    echo "⏭️  $DIR 이미 설정됨"
  fi
done
