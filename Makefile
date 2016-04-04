
.PHONY: android ios

android:
	gulp
	ionic build android

ios:
	gulp
	ionic build ios
	
