require 'net/http'
require 'net/https'
require 'uri'

class RestHelper

    def self.get(uri, header)
        get_uri = URI.parse(uri)

        https = Net::HTTP.new(get_uri.host,get_uri.port)
        https.use_ssl = true

        my_get_request = Net::HTTP::Get.new(get_uri.path)

        header.keys.each do |key|
            my_get_request.add_field(key, header[key])
        end

        response = https.request(my_get_request)

        if response.body
            return JSON.parse(response.body)
        else
            return nil
        end
    end

    def self.put(uri, body, header)
      put_uri = URI.parse(uri)
      https = Net::HTTP.new(put_uri.host,put_uri.port)
      https.use_ssl = true

      my_put_request = Net::HTTP::Put.new(put_uri.path, initheader = header)
      my_put_request.set_form_data(body)

      response = https.request(my_put_request)

      if response.body
        return JSON.parse(response.body)
      else
        return nil
      end      
    end

    def self.post(uri, body, header)
      post_uri = URI.parse(uri)
      https = Net::HTTP.new(post_uri.host, post_uri.port)
      https.use_ssl = true
      my_post_request = Net::HTTP::Post.new(post_uri.path, initheader = header)
      my_post_request.set_form_data(body)
      response = https.request(my_post_request)

      if response.body
        return JSON.parse(response.body)
      else
        return nil
      end 
    end
end